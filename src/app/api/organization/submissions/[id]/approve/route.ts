import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";
import { createPublicToken, hashSecret } from "@/lib/secure-token";

type Props = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Props) {
  const auth = await requirePermission(permissions.guestsManage);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const submission = await prisma.organizationSubmission.findUnique({
    where: { id },
    include: { guests: true, event: true },
  });
  if (!submission) return NextResponse.json({ message: "Submission not found." }, { status: 404 });
  if (submission.status === "APPROVED") return NextResponse.json({ message: "Submission already approved." }, { status: 409 });

  const result = await prisma.$transaction(async (tx) => {
    let created = 0;
    for (const draft of submission.guests) {
      const duplicate = await tx.guest.findFirst({
        where: { eventId: submission.eventId, phone: draft.phone },
        select: { id: true },
      });
      if (duplicate) continue;

      const category =
        (await tx.guestCategory.findUnique({ where: { name: draft.categoryName } })) ??
        (await tx.guestCategory.findUnique({ where: { name: "Special Guest" } }));
      if (!category) continue;

      const guest = await tx.guest.create({
        data: {
          eventId: submission.eventId,
          fullName: draft.fullName,
          phone: draft.phone,
          email: draft.email,
          categoryId: category.id,
          organization: submission.organizationName,
          title: draft.title,
          source: "INVITED",
          registrationStatus: "PENDING",
          invitation: { create: { status: "DRAFT", token: createPublicToken("invite") } },
        },
      });

      const ticket = await tx.ticket.create({
        data: {
          guestId: guest.id,
          eventId: submission.eventId,
          ticketId: `AP26-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
          accessType: category.accessType,
          status: "GENERATED",
          token: {
            create: { tokenHash: hashSecret(createPublicToken("ticket")) },
          },
        },
      });

      await tx.organizationSubmissionGuest.update({
        where: { id: draft.id },
        data: { createdGuestId: guest.id },
      });

      created += ticket ? 1 : 0;
    }

    await tx.organizationSubmission.update({
      where: { id: submission.id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: auth.session.user.id,
        action: "organization_submission.approved",
        entityType: "OrganizationSubmission",
        entityId: submission.id,
        metadata: { createdGuests: created, organizationName: submission.organizationName },
      },
    });

    return created;
  });

  return NextResponse.json({ status: "APPROVED", createdGuests: result });
}
