import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const guestSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  email: z.string().trim().email().optional().or(z.literal("")),
  categoryName: z.string().trim().min(2),
  title: z.string().trim().optional(),
  faydaLast4: z.string().trim().max(4).optional(),
  notes: z.string().trim().optional(),
});

const payloadSchema = z.object({
  eventId: z.string().min(1),
  organizationName: z.string().trim().min(2),
  contactName: z.string().trim().min(2),
  contactPhone: z.string().trim().min(8),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  notes: z.string().trim().optional(),
  guests: z.array(guestSchema).min(1).max(500),
});

export async function POST(request: Request) {
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Invalid organization submission." }, { status: 422 });
  }

  const event = await prisma.event.findUnique({ where: { id: payload.data.eventId }, select: { id: true, name: true } });
  if (!event) return NextResponse.json({ message: "Event not found." }, { status: 404 });

  const duplicatePhones = new Set<string>();
  for (const guest of payload.data.guests) {
    if (duplicatePhones.has(guest.phone)) {
      return NextResponse.json({ message: `Duplicate phone in submission: ${guest.phone}` }, { status: 422 });
    }
    duplicatePhones.add(guest.phone);
  }

  const existingGuest = await prisma.guest.findFirst({
    where: {
      eventId: event.id,
      phone: { in: payload.data.guests.map((guest) => guest.phone) },
    },
    select: { fullName: true, phone: true },
  });
  if (existingGuest) {
    return NextResponse.json({ message: `Guest already exists for this event: ${existingGuest.fullName} (${existingGuest.phone}).` }, { status: 409 });
  }

  const submission = await prisma.organizationSubmission.create({
    data: {
      eventId: event.id,
      organizationName: payload.data.organizationName,
      contactName: payload.data.contactName,
      contactPhone: payload.data.contactPhone,
      contactEmail: payload.data.contactEmail || null,
      notes: payload.data.notes || null,
      guests: {
        create: payload.data.guests.map((guest) => ({
          fullName: guest.fullName,
          phone: guest.phone,
          email: guest.email || null,
          categoryName: guest.categoryName,
          title: guest.title || null,
          faydaLast4: guest.faydaLast4 || null,
          notes: guest.notes || null,
        })),
      },
    },
    include: { guests: true },
  });

  return NextResponse.json({
    id: submission.id,
    status: submission.status,
    eventName: event.name,
    guestCount: submission.guests.length,
  }, { status: 201 });
}
