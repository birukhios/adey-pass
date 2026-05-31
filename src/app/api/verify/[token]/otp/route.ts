import { OtpPurpose } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, hashSecret } from "@/lib/secure-token";

const payloadSchema = z.object({
  phone: z.string().trim().min(8),
  faydaNumber: z.string().trim().min(8),
});

type Props = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Props) {
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Phone and Fayda number are required." }, { status: 422 });
  }

  const { token } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { OR: [{ id: token }, { ticketId: token }] },
    select: { id: true },
  });
  if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpChallenge.create({
    data: {
      phone: payload.data.phone,
      purpose: OtpPurpose.ID_VERIFICATION,
      ticketToken: token,
      codeHash: hashSecret(code),
      deliveryHint: `Mock OTP sent to ${payload.data.phone}`,
      expiresAt,
    },
  });

  return NextResponse.json({
    message: "OTP sent.",
    expiresAt,
    demoOtp: code,
  });
}
