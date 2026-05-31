import { CheckInStatus, InvitationStatus, RegistrationStatus, TicketStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  guestIds: z.array(z.string().min(1)).min(1),
  action: z.enum(["BLOCK", "DELETE"]),
});

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.guestsManage);
  if ("error" in auth) return auth.error;

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Select guests and choose a valid action." }, { status: 422 });
  }

  const { guestIds, action } = payload.data;

  if (action === "DELETE") {
    const deleted = await prisma.guest.deleteMany({ where: { id: { in: guestIds } } });
    await prisma.auditLog.create({
      data: {
        actorUserId: auth.session.user.id,
        action: "guests.bulk_delete",
        entityType: "Guest",
        entityId: "bulk",
        metadata: { count: deleted.count },
      },
    });
    return NextResponse.json({ action, count: deleted.count });
  }

  const [tickets, invitations, guests] = await prisma.$transaction([
    prisma.ticket.updateMany({
      where: { guestId: { in: guestIds } },
      data: { status: TicketStatus.BLOCKED, cancelledAt: new Date() },
    }),
    prisma.invitation.updateMany({
      where: { guestId: { in: guestIds } },
      data: { status: InvitationStatus.CANCELLED, cancelledAt: new Date() },
    }),
    prisma.guest.updateMany({
      where: { id: { in: guestIds } },
      data: {
        registrationStatus: RegistrationStatus.REJECTED,
        checkInStatus: CheckInStatus.REJECTED,
      },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      actorUserId: auth.session.user.id,
      action: "guests.bulk_block",
      entityType: "Guest",
      entityId: "bulk",
      metadata: { guests: guests.count, tickets: tickets.count, invitations: invitations.count },
    },
  });

  return NextResponse.json({ action, count: guests.count });
}
