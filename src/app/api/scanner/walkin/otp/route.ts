import { OtpPurpose } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";
import { generateOtpCode, hashSecret } from "@/lib/secure-token";

const payloadSchema = z.object({
  phone: z.string().trim().min(8),
  faydaNumber: z.string().trim().min(8),
});

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.walkinsCreate);
  if ("error" in auth) return auth.error;

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Phone and Fayda number are required." }, { status: 422 });

  const code = generateOtpCode();
  const challenge = await prisma.otpChallenge.create({
    data: {
      phone: payload.data.phone,
      purpose: OtpPurpose.WALK_IN_VERIFICATION,
      codeHash: hashSecret(code),
      deliveryHint: `Mock OTP sent to ${payload.data.phone}`,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    select: { id: true, expiresAt: true },
  });

  return NextResponse.json({ ...challenge, demoOtp: code });
}
