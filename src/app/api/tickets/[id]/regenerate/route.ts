import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { TicketStatus } from "@prisma/client";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";
import { hashSecret } from "@/lib/secure-token";

type Props = { params: Promise<{ id: string }> };

function createTicketId() {
  return `AP26-${crypto.randomBytes(2).toString("hex").toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(_: Request, { params }: Props) {
  const auth = await requirePermission(permissions.ticketsManage);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const updated = await prisma.$transaction(async (tx) => {
    const ticketId = createTicketId();
    const ticket = await tx.ticket.update({
      where: { id },
      data: {
        ticketId,
        status: TicketStatus.GENERATED,
        cancelledAt: null,
        usedAt: null,
      },
      select: { id: true, ticketId: true, status: true },
    });
    await tx.qrToken.upsert({
      where: { ticketId: ticket.id },
      update: { tokenHash: hashSecret(ticketId), status: TicketStatus.GENERATED, lastUsedAt: null },
      create: { ticketId: ticket.id, tokenHash: hashSecret(ticketId), status: TicketStatus.GENERATED },
    });
    return ticket;
  });

  return NextResponse.json(updated);
}
