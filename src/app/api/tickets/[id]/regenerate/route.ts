import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { TicketStatus } from "@prisma/client";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

type Props = { params: Promise<{ id: string }> };

function createTicketId() {
  return `AP26-${crypto.randomBytes(2).toString("hex").toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(_: Request, { params }: Props) {
  const auth = await requirePermission(permissions.ticketsManage);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      ticketId: createTicketId(),
      status: TicketStatus.GENERATED,
      cancelledAt: null,
      usedAt: null,
    },
    select: { id: true, ticketId: true, status: true },
  });

  return NextResponse.json(updated);
}
