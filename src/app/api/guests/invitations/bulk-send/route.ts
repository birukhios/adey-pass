import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";
import { createPublicToken } from "@/lib/secure-token";

const payloadSchema = z.object({
  guestIds: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.guestsManage);
  if ("error" in auth) return auth.error;

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Select at least one guest." }, { status: 422 });
  }

  const guests = await prisma.guest.findMany({
    where: { id: { in: payload.data.guestIds } },
    include: { invitation: true },
  });

  const results = await prisma.$transaction(async (tx) => {
    const links: Array<{ guestId: string; name: string; token: string }> = [];

    for (const guest of guests) {
      const token = guest.invitation?.token ?? createPublicToken("invite");
      await tx.invitation.upsert({
        where: { guestId: guest.id },
        update: { status: "SENT", sentAt: new Date(), token },
        create: { guestId: guest.id, status: "SENT", sentAt: new Date(), token },
      });
      links.push({ guestId: guest.id, name: guest.fullName, token });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: auth.session.user.id,
        action: "invitations.bulk_send",
        entityType: "Invitation",
        entityId: "bulk",
        metadata: { count: links.length },
      },
    });

    return links;
  });

  return NextResponse.json({ sentCount: results.length, links: results });
}
