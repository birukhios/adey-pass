import { NextResponse } from "next/server";
import { OtpPurpose } from "@prisma/client";
import { z } from "zod";
import { issuePublicTicket } from "@/lib/public-ticketing";
import { verifyOtpChallenge } from "@/lib/otp-verification";
import { resolveBookingTicketType } from "@/lib/ticket-types";

const payloadSchema = z.object({
  bookingToken: z.string().min(4),
  ticketTypeId: z.string().optional(),
  fullName: z.string().min(2),
  companyName: z.string().min(2).optional(),
  phone: z.string().min(8),
  faydaNumber: z.string().min(8),
  otp: z.string().min(4),
});

export async function POST(request: Request) {
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid booking payload." }, { status: 422 });

  const ticketType = await resolveBookingTicketType(payload.data.bookingToken, payload.data.ticketTypeId);
  if (!ticketType) return NextResponse.json({ message: "Ticket type not found." }, { status: 404 });
  if (ticketType.paymentRequired && ticketType.priceAmount > 0) {
    return NextResponse.json({ message: "This ticket requires checkout first." }, { status: 422 });
  }

  try {
    await verifyOtpChallenge({
      phone: payload.data.phone,
      otp: payload.data.otp,
      ticketToken: `booking:${ticketType.id}`,
      purposes: [OtpPurpose.ID_VERIFICATION],
    });

    const result = await issuePublicTicket({
      eventTicketTypeId: ticketType.id,
      fullName: payload.data.fullName,
      companyName: payload.data.companyName,
      phone: payload.data.phone,
      faydaNumber: payload.data.faydaNumber,
    });

    return NextResponse.json({
      ticketId: result.ticket.ticketId,
      ticketDbId: result.ticket.id,
      ticketUrl: `/ticket/${result.ticket.id}`,
      eventName: result.ticketType.event.name,
      accessType: result.ticketType.accessType,
      reused: result.reused,
      sms: `Mock SMS sent to ${payload.data.phone} with ticket ${result.ticket.ticketId}.`,
    }, { status: result.reused ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not complete booking." }, { status: 422 });
  }
}
