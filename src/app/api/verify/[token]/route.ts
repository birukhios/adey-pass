import { VerificationMethod, VerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashSecret, maskIdNumber } from "@/lib/secure-token";

const payloadSchema = z.object({
  fullName: z.string().min(2),
  idNumber: z.string().min(8),
  phone: z.string().min(8),
  otp: z.string().min(4),
  dateOfBirth: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  currentAddress: z.string().optional(),
  consent: z.boolean(),
});

type Props = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Props) {
  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.consent) {
    return NextResponse.json({ message: "Invalid verification payload." }, { status: 422 });
  }
  const { token } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { OR: [{ id: token }, { ticketId: token }] },
    include: { guest: true },
  });
  if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 });

  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      ticketToken: token,
      phone: parsed.data.phone,
      expiresAt: { gt: new Date() },
      verifiedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) {
    return NextResponse.json({ message: "Send OTP before submitting verification." }, { status: 422 });
  }

  if (challenge.codeHash !== hashSecret(parsed.data.otp)) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ message: "Invalid OTP code." }, { status: 422 });
  }

  const masked = maskIdNumber(parsed.data.idNumber);
  const idNumberHash = hashSecret(parsed.data.idNumber);

  const duplicateVerification = await prisma.idVerification.findFirst({
    where: {
      idNumberHash,
      guestId: { not: ticket.guestId },
      eventId: ticket.eventId,
    },
    select: { maskedIdNumber: true },
  });
  if (duplicateVerification) {
    return NextResponse.json({ message: `Duplicate Fayda/National ID detected (${duplicateVerification.maskedIdNumber}).` }, { status: 409 });
  }

  const verification = await prisma.$transaction(async (tx) => {
    await tx.otpChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: new Date() },
    });
    const saved = await tx.idVerification.upsert({
      where: { guestId: ticket.guestId },
      update: {
        fullName: parsed.data.fullName,
        maskedIdNumber: masked,
        idNumberHash,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
        gender: parsed.data.gender || null,
        nationality: parsed.data.nationality || null,
        currentAddress: parsed.data.currentAddress || null,
        consentGiven: true,
        status: VerificationStatus.VERIFIED,
        method: VerificationMethod.MOCK_PROVIDER,
        verifiedAt: new Date(),
      },
      create: {
        guestId: ticket.guestId,
        eventId: ticket.eventId,
        fullName: parsed.data.fullName,
        maskedIdNumber: masked,
        idNumberHash,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
        gender: parsed.data.gender || null,
        nationality: parsed.data.nationality || null,
        currentAddress: parsed.data.currentAddress || null,
        consentGiven: true,
        status: VerificationStatus.VERIFIED,
        method: VerificationMethod.MOCK_PROVIDER,
        verifiedAt: new Date(),
      },
      select: {
        status: true,
        maskedIdNumber: true,
        fullName: true,
        phone: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        nationality: true,
        currentAddress: true,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "verification.otp_verified",
        entityType: "Guest",
        entityId: ticket.guestId,
        metadata: { method: "mock_otp", maskedIdNumber: masked },
      },
    });
    return saved;
  });

  return NextResponse.json(verification);
}
