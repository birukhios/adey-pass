import crypto from "node:crypto";
import {
  GuestSource,
  RegistrationStatus,
  TicketStatus,
  VerificationMethod,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashSecret, maskIdNumber } from "@/lib/secure-token";

type IssuePublicTicketInput = {
  eventTicketTypeId: string;
  fullName: string;
  companyName?: string | null;
  phone: string;
  faydaNumber: string;
  source?: GuestSource;
  paidReference?: string;
};

export async function issuePublicTicket(input: IssuePublicTicketInput) {
  const ticketType = await prisma.eventTicketType.findUnique({
    where: { id: input.eventTicketTypeId },
    include: { event: true },
  });
  if (!ticketType) throw new Error("Ticket type not found.");

  const category =
    (await prisma.guestCategory.findFirst({
      where: {
        OR: [
          { accessType: ticketType.accessType },
          { name: ticketType.name },
          { name: { contains: ticketType.name.split(" ")[0] ?? ticketType.name } },
        ],
      },
      orderBy: { name: "asc" },
    })) ||
    (await prisma.guestCategory.findFirst({
      where: { name: "Walk-In" },
    })) ||
    (await prisma.guestCategory.findFirst());
  if (!category) throw new Error("Guest category missing.");

  const faydaHash = hashSecret(input.faydaNumber);
  const existing = await prisma.guest.findFirst({
    where: {
      eventId: ticketType.eventId,
      OR: [
        { phone: input.phone },
        { idVerification: { idNumberHash: faydaHash } },
      ],
    },
    include: { ticket: true, idVerification: true, category: true, event: true },
  });
  if (existing?.ticket) {
    return { guest: existing, ticket: existing.ticket, ticketType, reused: true };
  }

  const ticketId = input.paidReference ?? `AP26-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const result = await prisma.$transaction(async (tx) => {
    const guest = existing ?? await tx.guest.create({
      data: {
        eventId: ticketType.eventId,
        fullName: input.fullName,
        phone: input.phone,
        organization: input.companyName || null,
        categoryId: category.id,
        source: input.source ?? GuestSource.PUBLIC_REGISTRATION,
        registrationStatus: RegistrationStatus.REGISTERED,
      },
    });

    if (!existing?.idVerification) {
      await tx.idVerification.create({
        data: {
          guestId: guest.id,
          eventId: ticketType.eventId,
          fullName: input.fullName,
          maskedIdNumber: maskIdNumber(input.faydaNumber),
          idNumberHash: faydaHash,
          phone: input.phone,
          status: VerificationStatus.VERIFIED,
          method: VerificationMethod.MOCK_PROVIDER,
          consentGiven: true,
          verifiedAt: new Date(),
        },
      });
    }

    const ticket = await tx.ticket.create({
      data: {
        guestId: guest.id,
        eventId: ticketType.eventId,
        ticketId,
        accessType: ticketType.accessType,
        status: TicketStatus.GENERATED,
      },
    });

    await tx.qrToken.create({
      data: {
        ticketId: ticket.id,
        tokenHash: hashSecret(ticket.ticketId),
        status: TicketStatus.GENERATED,
      },
    });

    return { guest, ticket };
  });

  return { ...result, ticketType, reused: false };
}
