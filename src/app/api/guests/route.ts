import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";
import { createPublicToken, hashSecret } from "@/lib/secure-token";

const payloadSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  email: z.string().trim().email().optional().or(z.literal("")),
  categoryId: z.string().min(1),
  eventId: z.string().min(1),
  organization: z.string().trim().optional(),
  title: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  generateTicket: z.boolean().default(true),
});

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.guestsManage);
  if ("error" in auth) return auth.error;

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Invalid guest payload." }, { status: 422 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const [event, category] = await Promise.all([
      tx.event.findUnique({ where: { id: payload.data.eventId }, select: { id: true, name: true } }),
      tx.guestCategory.findUnique({ where: { id: payload.data.categoryId }, select: { id: true, name: true, accessType: true } }),
    ]);

    if (!event) throw new Error("Event not found.");
    if (!category) throw new Error("Guest category not found.");

    const duplicate = await tx.guest.findFirst({
      where: {
        eventId: event.id,
        OR: [
          { phone: payload.data.phone },
          ...(payload.data.email ? [{ email: payload.data.email }] : []),
        ],
      },
      select: { fullName: true, phone: true, email: true },
    });
    if (duplicate) {
      throw new Error(`Duplicate guest detected for this event: ${duplicate.fullName} (${duplicate.phone}).`);
    }

    const guest = await tx.guest.create({
      data: {
        eventId: event.id,
        fullName: payload.data.fullName,
        phone: payload.data.phone,
        email: payload.data.email || null,
        categoryId: category.id,
        organization: payload.data.organization || null,
        title: payload.data.title || null,
        notes: payload.data.notes || null,
        source: "INVITED",
        registrationStatus: payload.data.generateTicket ? "REGISTERED" : "PENDING",
        invitation: { create: { status: "DRAFT", token: createPublicToken("invite") } },
      },
      include: { invitation: true },
    });

    let ticket: { id: string; ticketId: string; status: string } | null = null;
    if (payload.data.generateTicket) {
      const token = createPublicToken("ticket");
      ticket = await tx.ticket.create({
        data: {
          guestId: guest.id,
          eventId: event.id,
          ticketId: `AP26-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
          accessType: category.accessType,
          status: "GENERATED",
          token: {
            create: {
              tokenHash: hashSecret(token),
            },
          },
        },
        select: { id: true, ticketId: true, status: true },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "guest.single_create",
        entityType: "Guest",
        entityId: guest.id,
        actorUserId: auth.session.user.id,
        metadata: { generateTicket: payload.data.generateTicket },
      },
    });

    return { guest, event, category, ticket };
  });

  return NextResponse.json({
    id: result.guest.id,
    name: result.guest.fullName,
    phone: result.guest.phone,
    email: result.guest.email ?? "",
    category: result.category.name,
    organization: result.guest.organization ?? "",
    role: result.guest.title ?? "",
    event: result.event.name,
    invitation: "Draft",
    registration: result.ticket ? "Registered" : "Pending",
    ticket: result.ticket ? "Generated" : "Not Generated",
    ticketId: result.ticket?.ticketId ?? "",
    linkToken: result.ticket?.id ?? "",
    invitationToken: result.guest.invitation?.token ?? "",
    verification: "Not Started",
    checkin: "Not Checked In",
  }, { status: 201 });
}
