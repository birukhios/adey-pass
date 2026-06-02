import { NextResponse } from "next/server";
import { TicketStatus } from "@prisma/client";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

type Props = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Props) {
  const auth = await requirePermission(permissions.ticketsManage);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const updated = await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.update({
      where: { id },
      data: { status: TicketStatus.CANCELLED, cancelledAt: new Date() },
      select: { id: true, status: true },
    });
    await tx.qrToken.updateMany({ where: { ticketId: id }, data: { status: TicketStatus.CANCELLED } });
    return ticket;
  });

  return NextResponse.json(updated);
}
