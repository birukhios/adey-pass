import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const ticketTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  accessType: z.string().min(2),
  quantity: z.number().int().min(0),
  designKey: z.string().min(2),
  layoutKey: z.string().min(2).default("mobile-pass"),
  primaryColor: z.string().min(4),
  accentColor: z.string().min(4),
  outlineColor: z.string().min(4),
});

const payloadSchema = z.object({
  ticketTypes: z.array(ticketTypeSchema),
});

type Props = { params: Promise<{ id: string }> };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "ticket";
}

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requirePermission(permissions.ticketsManage);
  if ("error" in auth) return auth.error;

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid ticket type payload." }, { status: 422 });

  const { id: eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, name: true } });
  if (!event) return NextResponse.json({ message: "Event not found." }, { status: 404 });

  const saved = await prisma.$transaction(async (tx) => {
    const incomingIds = payload.data.ticketTypes.map((ticketType) => ticketType.id).filter(Boolean) as string[];
    await tx.eventTicketType.deleteMany({ where: { eventId, id: { notIn: incomingIds } } });

    const rows = [];
    for (const [index, ticketType] of payload.data.ticketTypes.entries()) {
      const data = {
        name: ticketType.name,
        accessType: ticketType.accessType,
        quantity: ticketType.quantity,
        designKey: ticketType.designKey,
        layoutKey: ticketType.layoutKey,
        primaryColor: ticketType.primaryColor,
        accentColor: ticketType.accentColor,
        outlineColor: ticketType.outlineColor,
        sortOrder: index,
      };
      if (ticketType.id) {
        rows.push(await tx.eventTicketType.update({ where: { id: ticketType.id }, data }));
      } else {
        rows.push(
          await tx.eventTicketType.create({
            data: {
              eventId,
              ...data,
              bookingToken: `${slugify(event.name)}-${slugify(ticketType.name)}-${crypto.randomUUID().slice(0, 8)}`,
            },
          }),
        );
      }
    }
    return rows;
  });

  return NextResponse.json({ ticketTypes: saved });
}
