import { CheckInStatus, TicketStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  query: z.string().min(2),
  gateId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.scannerUse);
  if ("error" in auth) return auth.error;

  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid lookup payload." }, { status: 422 });
  }

  const query = parsed.data.query.trim();
  let normalizedQuery = query;
  try {
    const maybeJson = JSON.parse(query) as { token?: string; ticketId?: string };
    normalizedQuery = maybeJson.token ?? maybeJson.ticketId ?? query;
  } catch {
    normalizedQuery = query;
  }
  if (parsed.data.gateId && !auth.session.user.permissions?.includes(permissions.scannerOverride)) {
    const assignment = await prisma.gateOfficerAssignment.findUnique({
      where: { userId_gateId: { userId: auth.session.user.id, gateId: parsed.data.gateId } },
    });
    const hasAnyAssignment = await prisma.gateOfficerAssignment.count({
      where: { userId: auth.session.user.id, active: true },
    });
    if (hasAnyAssignment > 0 && !assignment?.active) {
      return NextResponse.json({ status: "Gate Not Assigned" }, { status: 403 });
    }
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [
        { id: query },
        { id: normalizedQuery },
        { ticketId: normalizedQuery },
        { guest: { phone: { contains: normalizedQuery } } },
        { guest: { fullName: { contains: normalizedQuery } } },
      ],
    },
    include: { guest: { include: { idVerification: true, category: true } }, event: true, gate: true },
  });

  if (!ticket) return NextResponse.json({ status: "Ticket Not Found" }, { status: 404 });
  if (ticket.status === TicketStatus.CANCELLED) return NextResponse.json({ status: "Ticket Cancelled" }, { status: 409 });
  if (parsed.data.gateId && ticket.event.gateUsageEnabled) {
    const eventGate = await prisma.eventGate.findUnique({
      where: { eventId_gateId: { eventId: ticket.eventId, gateId: parsed.data.gateId } },
    });
    if (!eventGate) return NextResponse.json({ status: "Wrong Gate" }, { status: 409 });
  }

  if (ticket.guest.idVerification && !["VERIFIED", "MANUALLY_APPROVED"].includes(ticket.guest.idVerification.status)) {
    return NextResponse.json({ status: "Verification Required", ticket });
  }

  const priorCheckin = await prisma.checkin.findFirst({
    where: { ticketId: ticket.id, result: CheckInStatus.CHECKED_IN },
  });
  if (priorCheckin) {
    await prisma.checkin.create({
      data: {
        guestId: ticket.guestId,
        ticketId: ticket.id,
        eventId: ticket.eventId,
        gateId: parsed.data.gateId ?? ticket.gateId ?? null,
        checkedInById: auth.session.user.id,
        method: "MANUAL_LOOKUP",
        result: CheckInStatus.DUPLICATE_ATTEMPT,
      },
    });
    return NextResponse.json({
      status: "Already Checked In",
      ticket: { ...ticket, firstCheckedInAt: priorCheckin.checkedInAt, usedAt: ticket.usedAt ?? priorCheckin.checkedInAt },
    }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.checkin.create({
      data: {
        guestId: ticket.guestId,
        ticketId: ticket.id,
        eventId: ticket.eventId,
        gateId: parsed.data.gateId ?? ticket.gateId ?? null,
        checkedInById: auth.session.user.id,
        method: "MANUAL_LOOKUP",
        result: CheckInStatus.CHECKED_IN,
      },
    }),
    prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.USED, usedAt: new Date() },
    }),
    prisma.guest.update({
      where: { id: ticket.guestId },
      data: { checkInStatus: CheckInStatus.CHECKED_IN },
    }),
  ]);

  return NextResponse.json({ status: "Allow Entry", ticket });
}
