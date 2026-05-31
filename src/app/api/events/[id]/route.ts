import { EventStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  status: z.nativeEnum(EventStatus).optional(),
  gateUsageEnabled: z.boolean().optional(),
  selectedGateIds: z.array(z.string()).optional(),
  idVerificationRequired: z.boolean().optional(),
  walkInRegistrationAllowed: z.boolean().optional(),
  maxAttendees: z.number().int().positive().nullable().optional(),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requirePermission(permissions.eventsManage);
  if ("error" in auth) return auth.error;
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid event update." }, { status: 422 });
  const { id } = await params;

  const updated = await prisma.$transaction(async (tx) => {
    const event = await tx.event.update({
      where: { id },
      data: {
        ...(payload.data.status ? { status: payload.data.status } : {}),
        ...(payload.data.gateUsageEnabled !== undefined ? { gateUsageEnabled: payload.data.gateUsageEnabled } : {}),
        ...(payload.data.idVerificationRequired !== undefined ? { idVerificationRequired: payload.data.idVerificationRequired } : {}),
        ...(payload.data.walkInRegistrationAllowed !== undefined ? { walkInRegistrationAllowed: payload.data.walkInRegistrationAllowed } : {}),
        ...(payload.data.maxAttendees !== undefined ? { maxAttendees: payload.data.maxAttendees } : {}),
      },
      select: {
        id: true,
        status: true,
        gateUsageEnabled: true,
        idVerificationRequired: true,
        walkInRegistrationAllowed: true,
        maxAttendees: true,
      },
    });

    if (payload.data.selectedGateIds) {
      await tx.eventGate.deleteMany({ where: { eventId: id } });
      if (payload.data.gateUsageEnabled && payload.data.selectedGateIds.length) {
        await tx.eventGate.createMany({
          data: payload.data.selectedGateIds.map((gateId) => ({ eventId: id, gateId })),
        });
      }
    }

    return event;
  });

  return NextResponse.json(updated);
}
