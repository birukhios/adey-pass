import crypto from "node:crypto";
import { CheckInStatus, GuestSource, RegistrationStatus, TicketStatus, VerificationMethod, VerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";
import { hashSecret } from "@/lib/secure-token";

const payloadSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  faydaNumber: z.string().min(8),
  idType: z.string().optional(),
  otp: z.string().min(4),
  checkInImmediately: z.boolean().default(false),
  eventId: z.string().optional(),
  eventTicketTypeId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.walkinsCreate);
  if ("error" in auth) return auth.error;

  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "Invalid walk-in payload." }, { status: 422 });

  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      phone: parsed.data.phone,
      purpose: "WALK_IN_VERIFICATION",
      expiresAt: { gt: new Date() },
      verifiedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return NextResponse.json({ message: "Send OTP before registering walk-in guest." }, { status: 422 });
  if (challenge.codeHash !== hashSecret(parsed.data.otp)) {
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ message: "Invalid OTP code." }, { status: 422 });
  }

  const event =
    (parsed.data.eventId &&
      (await prisma.event.findUnique({ where: { id: parsed.data.eventId } }))) ||
    (await prisma.event.findFirst({ where: { status: "ACTIVE" }, orderBy: { date: "asc" } }));
  if (!event) return NextResponse.json({ message: "No active event found." }, { status: 404 });

  const walkInCategory = await prisma.guestCategory.findUnique({ where: { name: "Walk-In" } });
  if (!walkInCategory) return NextResponse.json({ message: "Walk-In category missing." }, { status: 500 });
  const ticketType = parsed.data.eventTicketTypeId
    ? await prisma.eventTicketType.findFirst({ where: { id: parsed.data.eventTicketTypeId, eventId: event.id } })
    : await prisma.eventTicketType.findFirst({ where: { eventId: event.id, paymentRequired: false }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  if (ticketType?.paymentRequired && ticketType.priceAmount > 0) {
    return NextResponse.json({ message: "This walk-in ticket type requires checkout first." }, { status: 422 });
  }
  const faydaHash = crypto.createHash("sha256").update(parsed.data.faydaNumber).digest("hex");

  const duplicate = await prisma.guest.findFirst({
    where: {
      eventId: event.id,
      OR: [
        { phone: parsed.data.phone },
        { idVerification: { idNumberHash: faydaHash } },
      ],
    },
    select: { fullName: true, phone: true },
  });
  if (duplicate) {
    return NextResponse.json({ message: `Duplicate walk-in detected: ${duplicate.fullName} (${duplicate.phone}).` }, { status: 409 });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.otpChallenge.update({ where: { id: challenge.id }, data: { verifiedAt: new Date() } });
    const guest = await tx.guest.create({
      data: {
        eventId: event.id,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        categoryId: walkInCategory.id,
        source: GuestSource.WALK_IN,
        registrationStatus: RegistrationStatus.REGISTERED,
        checkInStatus: parsed.data.checkInImmediately ? CheckInStatus.CHECKED_IN : CheckInStatus.NOT_CHECKED_IN,
      },
    });

    await tx.idVerification.create({
      data: {
        guestId: guest.id,
        eventId: event.id,
        fullName: guest.fullName,
        maskedIdNumber: `XXXX-XXXX-${parsed.data.faydaNumber.slice(-4)}`,
        idNumberHash: faydaHash,
        phone: guest.phone,
        status: VerificationStatus.VERIFIED,
        method: VerificationMethod.MOCK_PROVIDER,
        consentGiven: true,
        verifiedAt: new Date(),
      },
    });

    const ticket = await tx.ticket.create({
      data: {
        guestId: guest.id,
        eventId: event.id,
        ticketId: `AP26-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        accessType: ticketType?.accessType ?? "General Admission",
        status: parsed.data.checkInImmediately ? TicketStatus.USED : TicketStatus.GENERATED,
        usedAt: parsed.data.checkInImmediately ? new Date() : null,
      },
    });

    await tx.qrToken.create({
      data: {
        ticketId: ticket.id,
        tokenHash: hashSecret(ticket.ticketId),
        status: ticket.status,
      },
    });

    if (parsed.data.checkInImmediately) {
      await tx.checkin.create({
        data: {
          guestId: guest.id,
          ticketId: ticket.id,
          eventId: event.id,
          checkedInById: auth.session.user.id,
          method: "WALK_IN",
          result: CheckInStatus.CHECKED_IN,
        },
      });
    }

    await tx.walkinRegistration.create({
      data: {
        guestId: guest.id,
        eventId: event.id,
        registeredById: auth.session.user.id,
        checkedInImmediately: parsed.data.checkInImmediately,
      },
    });

    return { guest, ticket };
  });

  return NextResponse.json({
    ...result,
    ticketUrl: `/ticket/${result.ticket.id}`,
  });
}
