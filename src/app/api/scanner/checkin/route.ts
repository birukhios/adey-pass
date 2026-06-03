import { CheckInStatus, TicketStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";
import { hashSecret } from "@/lib/secure-token";

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
  const lookupCandidates = getScanLookupCandidates(query);
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

  const qrToken = await prisma.qrToken.findFirst({
    where: { tokenHash: { in: lookupCandidates.map((candidate) => hashSecret(candidate)) } },
    include: { ticket: true },
  });

  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [
        ...(qrToken?.ticketId ? [{ id: qrToken.ticketId }] : []),
        { id: { in: lookupCandidates } },
        { ticketId: { in: lookupCandidates } },
        { guest: { phone: { in: lookupCandidates } } },
        ...lookupCandidates.map((candidate) => ({ guest: { phone: { contains: candidate } } })),
        ...lookupCandidates.map((candidate) => ({ guest: { fullName: { contains: candidate } } })),
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
    prisma.qrToken.updateMany({
      where: { ticketId: ticket.id },
      data: { status: TicketStatus.USED, lastUsedAt: new Date() },
    }),
    prisma.guest.update({
      where: { id: ticket.guestId },
      data: { checkInStatus: CheckInStatus.CHECKED_IN },
    }),
  ]);

  return NextResponse.json({
    status: "Allow Entry",
    ticket: { ...ticket, status: TicketStatus.USED, usedAt: new Date() },
  });
}

function getScanLookupCandidates(query: string) {
  const candidates = new Set<string>();
  const add = (value?: string | null) => {
    const clean = value?.trim();
    if (clean) candidates.add(clean);
  };

  let normalizedQuery = query.trim();
  add(normalizedQuery);

  try {
    const maybeJson = JSON.parse(normalizedQuery) as {
      token?: string;
      ticketId?: string;
      ticketDbId?: string;
      url?: string;
      reference?: string;
      paymentReference?: string;
      provider?: string;
    };
    add(maybeJson.token);
    add(maybeJson.url);
    add(maybeJson.ticketDbId);
    add(maybeJson.ticketId);
    add(maybeJson.reference);
    add(maybeJson.paymentReference);
    normalizedQuery = maybeJson.url ?? maybeJson.token ?? maybeJson.ticketDbId ?? maybeJson.ticketId ?? maybeJson.reference ?? normalizedQuery;
  } catch {
    // Plain QR values are supported.
  }

  try {
    const url = new URL(normalizedQuery);
    const parts = url.pathname.split("/").filter(Boolean);
    if (["ticket", "verify"].includes(parts[0] ?? "") && parts[1]) {
      add(parts[1]);
    }
    const token = url.searchParams.get("token") ?? url.searchParams.get("ticketId");
    add(token);
  } catch {
    if (normalizedQuery.includes("/ticket/") || normalizedQuery.includes("/verify/")) {
      const parts = normalizedQuery.split(/[/?#]/).filter(Boolean);
      const markerIndex = parts.findIndex((part) => part === "ticket" || part === "verify");
      if (markerIndex >= 0 && parts[markerIndex + 1]) add(parts[markerIndex + 1]);
    }
  }

  return Array.from(candidates);
}
