import crypto from "node:crypto";
import { InvitationStatus, RegistrationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPublicToken, hashSecret } from "@/lib/secure-token";

const payloadSchema = z.object({
  decision: z.enum(["ACCEPTED", "DECLINED"]),
  phone: z.string().trim().min(8).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  notes: z.string().trim().optional(),
});

type Props = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Props) {
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid RSVP payload." }, { status: 422 });
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { guest: { include: { category: true, ticket: true, event: true } } },
  });
  if (!invitation) return NextResponse.json({ message: "Invitation not found." }, { status: 404 });
  if (invitation.status === InvitationStatus.CANCELLED) {
    return NextResponse.json({ message: "Invitation was cancelled." }, { status: 409 });
  }

  if (payload.data.decision === "DECLINED") {
    await prisma.$transaction([
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.DECLINED, declinedAt: new Date() },
      }),
      prisma.guest.update({
        where: { id: invitation.guestId },
        data: { registrationStatus: RegistrationStatus.CANCELLED, notes: payload.data.notes ?? invitation.guest.notes },
      }),
      prisma.auditLog.create({
        data: {
          action: "invitation.declined",
          entityType: "Invitation",
          entityId: invitation.id,
          metadata: { source: "public_rsvp" },
        },
      }),
    ]);
    return NextResponse.json({ status: "DECLINED" });
  }

  const result = await prisma.$transaction(async (tx) => {
    const guest = await tx.guest.update({
      where: { id: invitation.guestId },
      data: {
        phone: payload.data.phone ?? invitation.guest.phone,
        email: payload.data.email || invitation.guest.email,
        registrationStatus: RegistrationStatus.REGISTERED,
      },
      include: { category: true },
    });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date(), openedAt: invitation.openedAt ?? new Date() },
    });

    const ticket = invitation.guest.ticket ?? await tx.ticket.create({
      data: {
        guestId: guest.id,
        eventId: guest.eventId,
        ticketId: `AP26-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        accessType: guest.category.accessType,
        status: "GENERATED",
        token: {
          create: {
            tokenHash: hashSecret(createPublicToken("ticket")),
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        action: "invitation.accepted",
        entityType: "Invitation",
        entityId: invitation.id,
        metadata: { ticketId: ticket.ticketId, source: "public_rsvp" },
      },
    });

    return { ticketId: ticket.ticketId, ticketLink: `/ticket/${ticket.id}` };
  });

  return NextResponse.json({ status: "ACCEPTED", ...result });
}
