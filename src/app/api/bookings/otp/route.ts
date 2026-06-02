import { OtpPurpose } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, hashSecret } from "@/lib/secure-token";
import { resolveBookingTicketType } from "@/lib/ticket-types";

const payloadSchema = z.object({
  bookingToken: z.string().min(4),
  ticketTypeId: z.string().optional(),
  phone: z.string().trim().min(8),
  faydaNumber: z.string().trim().min(8),
});

export async function POST(request: Request) {
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Phone and Fayda number are required." }, { status: 422 });
  }

  const ticketType = await resolveBookingTicketType(payload.data.bookingToken, payload.data.ticketTypeId);
  if (!ticketType) return NextResponse.json({ message: "Booking link not found." }, { status: 404 });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpChallenge.create({
    data: {
      phone: payload.data.phone,
      purpose: OtpPurpose.ID_VERIFICATION,
      ticketToken: `booking:${ticketType.id}`,
      codeHash: hashSecret(code),
      deliveryHint: `Mock booking OTP sent to ${payload.data.phone}`,
      expiresAt,
    },
  });

  return NextResponse.json({
    message: "OTP sent.",
    expiresAt,
    demoOtp: code,
  });
}
