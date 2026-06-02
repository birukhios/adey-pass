import { OtpPurpose } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashSecret } from "@/lib/secure-token";

export async function verifyOtpChallenge({
  phone,
  otp,
  ticketToken,
  purposes,
}: {
  phone: string;
  otp: string;
  ticketToken?: string;
  purposes: OtpPurpose[];
}) {
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      phone,
      purpose: { in: purposes },
      ...(ticketToken ? { ticketToken } : {}),
      expiresAt: { gt: new Date() },
      verifiedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    throw new Error("Send and verify OTP before continuing.");
  }

  if (challenge.codeHash !== hashSecret(otp)) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Invalid OTP code.");
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { verifiedAt: new Date() },
  });

  return challenge;
}
