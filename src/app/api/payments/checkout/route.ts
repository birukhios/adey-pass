import crypto from "node:crypto";
import { OtpPurpose } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { maskIdNumber } from "@/lib/secure-token";
import { verifyOtpChallenge } from "@/lib/otp-verification";
import { resolveBookingTicketType } from "@/lib/ticket-types";

const payloadSchema = z.object({
  bookingToken: z.string().min(4),
  ticketTypeId: z.string().optional(),
  fullName: z.string().min(2),
  companyName: z.string().optional(),
  phone: z.string().min(8),
  faydaNumber: z.string().min(8),
  otp: z.string().min(4),
});

export async function POST(request: Request) {
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Invalid checkout payload." }, { status: 422 });
  }

  const ticketType = await resolveBookingTicketType(payload.data.bookingToken, payload.data.ticketTypeId);
  if (!ticketType) return NextResponse.json({ message: "Booking link not found." }, { status: 404 });
  if (!ticketType.paymentRequired || ticketType.priceAmount <= 0) {
    return NextResponse.json({ message: "This booking does not require checkout." }, { status: 422 });
  }

  try {
    await verifyOtpChallenge({
      phone: payload.data.phone,
      otp: payload.data.otp,
      ticketToken: `booking:${ticketType.id}`,
      purposes: [OtpPurpose.ID_VERIFICATION],
    });
  } catch (bookingOtpError) {
    try {
      await verifyOtpChallenge({
        phone: payload.data.phone,
        otp: payload.data.otp,
        purposes: [OtpPurpose.WALK_IN_VERIFICATION],
      });
    } catch {
      return NextResponse.json({ message: bookingOtpError instanceof Error ? bookingOtpError.message : "Verify OTP before checkout." }, { status: 422 });
    }
  }

  const reference = `AFRO-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  const checkoutToken = crypto.randomBytes(24).toString("base64url");
  const transaction = await prisma.paymentTransaction.create({
    data: {
      checkoutToken,
      reference,
      eventId: ticketType.eventId,
      eventTicketTypeId: ticketType.id,
      fullName: payload.data.fullName,
      companyName: payload.data.companyName || null,
      phone: payload.data.phone,
      maskedFaydaId: maskIdNumber(payload.data.faydaNumber),
      amount: ticketType.priceAmount,
      currency: ticketType.currency,
      provider: "Afropay",
      status: "PENDING",
    },
  });

  return NextResponse.json({
    checkoutToken: transaction.checkoutToken,
    checkoutUrl: `/checkout/${transaction.checkoutToken}`,
    reference: transaction.reference,
  }, { status: 201 });
}
