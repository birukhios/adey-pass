import { NextResponse } from "next/server";
import { z } from "zod";
import { issuePublicTicket } from "@/lib/public-ticketing";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  method: z.string().min(2),
});

type Props = { params: Promise<{ checkoutToken: string }> };

export async function POST(request: Request, { params }: Props) {
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid payment payload." }, { status: 422 });

  const { checkoutToken } = await params;
  const transaction = await prisma.paymentTransaction.findUnique({ where: { checkoutToken } });
  if (!transaction) return NextResponse.json({ message: "Checkout not found." }, { status: 404 });
  if (transaction.status === "PAID") return NextResponse.json(transaction);

  const paid = await prisma.paymentTransaction.update({
    where: { checkoutToken },
    data: {
      status: "PAID",
      method: payload.data.method,
      paidAt: new Date(),
    },
  });

  const issued = await issuePublicTicket({
    eventTicketTypeId: paid.eventTicketTypeId,
    fullName: paid.fullName,
    companyName: paid.companyName,
    phone: paid.phone ?? "",
    faydaNumber: paid.maskedFaydaId ?? paid.reference,
    paidReference: paid.reference,
  });

  return NextResponse.json({
    ...paid,
    ticketId: issued.ticket.ticketId,
    ticketUrl: `/ticket/${issued.ticket.ticketId}?sms=1`,
    sms: `SMS sent to ${paid.phone ?? "guest"} with your ticket link.`,
  });
}
