import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { allowedGuestCategories } from "@/lib/guest-csv";
import { authOptions } from "@/lib/auth";
import { permissions } from "@/lib/rbac";
import { createPublicToken } from "@/lib/secure-token";

const guestImportSchema = z.object({
  guests: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        phone: z.string().trim().min(1),
        email: z.string().trim().email().optional().or(z.literal("")),
        category: z.enum(allowedGuestCategories as [string, ...string[]]),
        organization: z.string().trim().optional(),
        role: z.string().trim().optional(),
        event: z.string().trim().min(1),
        notes: z.string().trim().optional(),
      }),
    )
    .min(1)
    .max(1000),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userPermissions = session?.user?.permissions ?? [];

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!userPermissions.includes(permissions.guestsManage)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const payload = guestImportSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      {
        message: "CSV import contains invalid guest data.",
        issues: payload.error.flatten(),
      },
      { status: 422 },
    );
  }

  try {
    const importedGuests = await prisma.$transaction(async (tx) => {
      const imported = [];

      for (const guest of payload.data.guests) {
        const event = await tx.event.findFirst({
          where: { name: guest.event, status: { not: "ARCHIVED" } },
          select: { id: true, name: true },
        });

        if (!event) {
          throw new Error(`Event not found or archived: ${guest.event}`);
        }

        const category = await tx.guestCategory.findUnique({
          where: { name: guest.category },
          select: { id: true, name: true },
        });

        if (!category) {
          throw new Error(`Guest category is not configured: ${guest.category}`);
        }

        const duplicate = await tx.guest.findFirst({
          where: {
            eventId: event.id,
            OR: [
              { phone: guest.phone },
              ...(guest.email ? [{ email: guest.email }] : []),
            ],
          },
          select: { fullName: true, phone: true },
        });
        if (duplicate) {
          throw new Error(`Duplicate guest detected in ${event.name}: ${duplicate.fullName} (${duplicate.phone}).`);
        }

        const createdGuest = await tx.guest.create({
          data: {
            eventId: event.id,
            fullName: guest.name,
            phone: guest.phone,
            email: guest.email || null,
            categoryId: category.id,
            organization: guest.organization || null,
            title: guest.role || null,
            source: "INVITED",
            notes: guest.notes || null,
            registrationStatus: "PENDING",
            invitation: {
              create: {
                status: "DRAFT",
                token: createPublicToken("invite"),
              },
            },
          },
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            organization: true,
            title: true,
            registrationStatus: true,
            event: { select: { name: true } },
            category: { select: { name: true } },
            invitation: { select: { status: true, token: true } },
          },
        });

        imported.push(createdGuest);
      }

      await tx.auditLog.create({
        data: {
          action: "guests.bulk_import",
          entityType: "Guest",
          entityId: "bulk",
          metadata: {
            count: payload.data.guests.length,
            source: "csv",
          },
        },
      });

      return imported;
    });

    return NextResponse.json({
      importedCount: importedGuests.length,
      guests: importedGuests.map((guest) => ({
        id: guest.id,
        name: guest.fullName,
        phone: guest.phone,
        email: guest.email ?? "",
        category: guest.category.name,
        organization: guest.organization ?? "",
        role: guest.title ?? "",
        event: guest.event.name,
        invitation: guest.invitation?.status ?? "DRAFT",
        registration: guest.registrationStatus,
        ticket: "Not Generated",
        invitationToken: guest.invitation?.token ?? "",
        verification: "Not Started",
        checkin: "Not Checked In",
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to import guests.",
      },
      { status: 500 },
    );
  }
}
