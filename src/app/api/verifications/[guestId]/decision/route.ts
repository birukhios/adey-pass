import { VerificationMethod, VerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

type Props = { params: Promise<{ guestId: string }> };

export async function POST(request: Request, { params }: Props) {
  const auth = await requirePermission(permissions.verificationApprove);
  if ("error" in auth) return auth.error;
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid decision." }, { status: 422 });
  const { guestId } = await params;

  const status = payload.data.decision === "approve" ? VerificationStatus.MANUALLY_APPROVED : VerificationStatus.FAILED;

  const verification = await prisma.idVerification.upsert({
    where: { guestId },
    update: {
      status,
      method: VerificationMethod.MANUAL,
      verifiedById: auth.session.user.id,
      verifiedAt: payload.data.decision === "approve" ? new Date() : null,
      rejectedReason: payload.data.decision === "reject" ? payload.data.reason ?? "Rejected by admin" : null,
    },
    create: {
      guestId,
      eventId: (await prisma.guest.findUniqueOrThrow({ where: { id: guestId }, select: { eventId: true } })).eventId,
      fullName: (await prisma.guest.findUniqueOrThrow({ where: { id: guestId }, select: { fullName: true } })).fullName,
      maskedIdNumber: "XXXX-XXXX-0000",
      idNumberHash: "manual",
      phone: (await prisma.guest.findUniqueOrThrow({ where: { id: guestId }, select: { phone: true } })).phone,
      consentGiven: true,
      method: VerificationMethod.MANUAL,
      status,
      verifiedById: auth.session.user.id,
      verifiedAt: payload.data.decision === "approve" ? new Date() : null,
      rejectedReason: payload.data.decision === "reject" ? payload.data.reason ?? "Rejected by admin" : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: auth.session.user.id,
      action: `verification.${payload.data.decision}`,
      entityType: "IdVerification",
      entityId: verification.id,
      metadata: { guestId, reason: payload.data.reason ?? null },
    },
  });

  return NextResponse.json({ status: verification.status });
}
