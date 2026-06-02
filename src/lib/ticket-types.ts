import { prisma } from "@/lib/prisma";

export async function resolveBookingTicketType(bookingToken: string, ticketTypeId?: string) {
  if (ticketTypeId) {
    return prisma.eventTicketType.findUnique({ where: { id: ticketTypeId }, include: { event: true } });
  }

  const byToken = await prisma.eventTicketType.findUnique({ where: { bookingToken }, include: { event: true } });
  if (byToken) return byToken;

  const event = await prisma.event.findUnique({ where: { id: bookingToken } });
  if (!event) return null;

  const existing = await prisma.eventTicketType.findFirst({
    where: { eventId: event.id, paymentRequired: false },
    include: { event: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (existing) return existing;

  return prisma.eventTicketType.create({
    data: {
      eventId: event.id,
      name: "General Admission",
      accessType: "General Admission",
      quantity: event.maxAttendees ?? 0,
      designKey: "normal-silver",
      layoutKey: "mobile-pass",
      primaryColor: "#0B7DE3",
      accentColor: "#64748B",
      outlineColor: "#071B3D",
      paymentRequired: false,
      priceAmount: 0,
      currency: "ETB",
      bookingToken: event.id,
      sortOrder: 999,
    },
    include: { event: true },
  });
}
