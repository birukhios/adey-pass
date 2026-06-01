import { EventStatus, EventType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const ticketTypeSchema = z.object({
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
  name: z.string().min(2),
  venueName: z.string().min(2),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  gateUsageEnabled: z.boolean().default(false),
  selectedGateIds: z.array(z.string()).default([]),
  idVerificationRequired: z.boolean().default(true),
  walkInRegistrationAllowed: z.boolean().default(true),
  maxAttendees: z.number().int().positive().optional().nullable(),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  description: z.string().optional(),
  securityDefaults: z.object({
    idVerificationRequiredByDefault: z.boolean(),
    walkInRegistrationAllowedByDefault: z.boolean(),
    ticketExpiryRule: z.string().min(2),
    duplicateCheckinPrevention: z.boolean(),
  }),
  ticketTypes: z.array(ticketTypeSchema).default([]),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "ticket";
}

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.eventsManage);
  if ("error" in auth) return auth.error;
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Invalid event payload." }, { status: 422 });
  }

  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.event.create({
      data: {
        name: payload.data.name,
        description: payload.data.description || null,
        date: new Date(payload.data.date),
        startTime: payload.data.startTime,
        endTime: payload.data.endTime,
        venueName: payload.data.venueName,
        eventType: EventType.REGISTRATION_ONLY,
        gateUsageEnabled: payload.data.gateUsageEnabled,
        idVerificationRequired: payload.data.idVerificationRequired,
        walkInRegistrationAllowed: payload.data.walkInRegistrationAllowed,
        maxAttendees: payload.data.maxAttendees ?? null,
        status: payload.data.status,
        createdById: auth.session.user.id,
      },
    });

    if (payload.data.gateUsageEnabled && payload.data.selectedGateIds.length) {
      await tx.eventGate.createMany({
        data: payload.data.selectedGateIds.map((gateId) => ({ eventId: created.id, gateId })),
      });
    }

    if (payload.data.ticketTypes.length) {
      await tx.eventTicketType.createMany({
        data: payload.data.ticketTypes.map((ticketType, index) => ({
          eventId: created.id,
          name: ticketType.name,
          accessType: ticketType.accessType,
          quantity: ticketType.quantity,
          designKey: ticketType.designKey,
          layoutKey: ticketType.layoutKey,
          primaryColor: ticketType.primaryColor,
          accentColor: ticketType.accentColor,
          outlineColor: ticketType.outlineColor,
          bookingToken: `${slugify(created.name)}-${slugify(ticketType.name)}-${created.id.slice(-6)}`,
          sortOrder: index,
        })),
      });
    }

    if (auth.session.user.permissions.includes(permissions.settingsManage)) {
      await tx.appSetting.upsert({
        where: { key: "security" },
        update: { value: payload.data.securityDefaults, updatedById: auth.session.user.id },
        create: { key: "security", value: payload.data.securityDefaults, updatedById: auth.session.user.id },
      });
    }

    return created;
  });

  return NextResponse.json(event, { status: 201 });
}
