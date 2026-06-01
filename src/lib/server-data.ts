import { CheckInStatus, InvitationStatus, RegistrationStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getEventsList() {
  const events = await prisma.event.findMany({
    orderBy: [{ date: "asc" }],
    include: {
      gates: { include: { gate: true } },
      guests: { select: { id: true } },
      checkins: { where: { result: CheckInStatus.CHECKED_IN }, select: { id: true } },
    },
  });

  return events.map((event) => ({
    id: event.id,
    name: event.name,
    date: event.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: `${event.startTime} - ${event.endTime}`,
    venue: event.venueName,
    status: event.status.charAt(0) + event.status.slice(1).toLowerCase(),
    registered: event.guests.length,
    checkedIn: event.checkins.length,
    gates: event.gates.map((gate) => gate.gate.name),
  }));
}

export async function getGatesList() {
  return prisma.gate.findMany({ orderBy: [{ name: "asc" }] });
}

export async function getEventOptions() {
  return prisma.event.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: [{ date: "asc" }],
    select: { id: true, name: true },
  });
}

export async function getGuestCategoryOptions() {
  return prisma.guestCategory.findMany({
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true },
  });
}

export async function getOrganizationSubmissions() {
  return prisma.organizationSubmission.findMany({
    include: {
      event: { select: { name: true } },
      guests: { select: { id: true } },
    },
    orderBy: { submittedAt: "desc" },
    take: 50,
  });
}

export async function getEventSummary(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      gates: { include: { gate: true } },
      guests: {
        include: {
          category: true,
          ticket: true,
        },
        take: 200,
        orderBy: { createdAt: "desc" },
      },
      checkins: { where: { result: CheckInStatus.CHECKED_IN }, select: { id: true } },
      idVerifications: { where: { status: VerificationStatus.PENDING }, select: { id: true } },
    },
  });
  return event;
}

export async function getGuestsList() {
  const guests = await prisma.guest.findMany({
    include: {
      event: true,
      category: true,
      invitation: true,
      ticket: true,
      idVerification: true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: 500,
  });

  return guests.map((guest) => ({
    id: guest.id,
    name: guest.fullName,
    phone: guest.phone,
    email: guest.email ?? "",
    category: guest.category.name,
    organization: guest.organization ?? "",
    role: guest.title ?? "",
    event: guest.event.name,
    invitation: titleCaseEnum(guest.invitation?.status ?? InvitationStatus.DRAFT),
    registration: titleCaseEnum(guest.registrationStatus),
    ticket: guest.ticket ? titleCaseEnum(guest.ticket.status) : "Not Generated",
    ticketId: guest.ticket?.ticketId ?? "",
    linkToken: guest.ticket?.id ?? "",
    invitationToken: guest.invitation?.token ?? "",
    source: titleCaseEnum(guest.source),
    createdAt: guest.createdAt.toISOString(),
    verification: titleCaseEnum(guest.idVerification?.status ?? VerificationStatus.NOT_STARTED),
    checkin: titleCaseEnum(guest.checkInStatus),
  }));
}

export async function getGuestDetail(guestId: string) {
  return prisma.guest.findUnique({
    where: { id: guestId },
    include: {
      category: true,
      event: true,
      ticket: true,
      idVerification: true,
      invitation: true,
    },
  });
}

export async function getTicketRows() {
  const tickets = await prisma.ticket.findMany({
    include: {
      guest: {
        include: {
          category: true,
          idVerification: true,
          invitation: true,
        },
      },
    },
    orderBy: [{ generatedAt: "desc" }],
    take: 500,
  });

  return tickets
    .filter((ticket) => ticket.guest.registrationStatus === RegistrationStatus.REGISTERED)
    .map((ticket) => ({
      id: ticket.guest.id,
      name: ticket.guest.fullName,
      access: ticket.accessType,
      invitation: titleCaseEnum(ticket.guest.invitation?.status ?? InvitationStatus.DRAFT),
      status: titleCaseEnum(ticket.status) as "Generated" | "Sent" | "Used" | "Cancelled" | "Expired",
      verification: titleCaseEnum(ticket.guest.idVerification?.status ?? VerificationStatus.NOT_STARTED) as
        | "Verified"
        | "Pending"
        | "Failed"
        | "Not Started"
        | "Manually Approved",
      ticketId: ticket.ticketId,
      linkToken: ticket.id,
    }));
}

export async function getTicketTypeBoard() {
  const events = await prisma.event.findMany({
    include: {
      ticketTypes: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      tickets: { select: { id: true, accessType: true } },
    },
    orderBy: [{ date: "asc" }],
  });

  return events.map((event) => ({
    id: event.id,
    name: event.name,
    stadium: event.venueName,
    date: event.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    ticketTypes: event.ticketTypes.map((ticketType) => ({
      id: ticketType.id,
      name: ticketType.name,
      accessType: ticketType.accessType,
      quantity: ticketType.quantity,
      designKey: ticketType.designKey,
      primaryColor: ticketType.primaryColor,
      accentColor: ticketType.accentColor,
      outlineColor: ticketType.outlineColor,
      bookingToken: ticketType.bookingToken,
      issuedCount: event.tickets.filter((ticket) => ticket.accessType === ticketType.accessType).length,
    })),
  }));
}

export async function getDashboardData() {
  const [eventsCount, guestsCount, ticketsCount, checkedInCount, walkInCount, pendingVerificationCount, failedVerificationCount] =
    await Promise.all([
      prisma.event.count(),
      prisma.guest.count({ where: { registrationStatus: RegistrationStatus.REGISTERED } }),
      prisma.ticket.count(),
      prisma.checkin.count({ where: { result: CheckInStatus.CHECKED_IN } }),
      prisma.guest.count({ where: { source: "WALK_IN" } }),
      prisma.idVerification.count({ where: { status: VerificationStatus.PENDING } }),
      prisma.idVerification.count({ where: { status: VerificationStatus.FAILED } }),
    ]);

  const guests = await prisma.guest.findMany({
    include: { category: true, event: true, ticket: true, idVerification: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const events = await getEventsList();

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const trendData: { day: string; registrations: number; checkins: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const from = new Date(dayStart);
    from.setDate(from.getDate() - i);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);

    const [registrations, checkins] = await Promise.all([
      prisma.guest.count({ where: { createdAt: { gte: from, lt: to } } }),
      prisma.checkin.count({ where: { checkedInAt: { gte: from, lt: to }, result: CheckInStatus.CHECKED_IN } }),
    ]);

    trendData.push({
      day: from.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      registrations,
      checkins,
    });
  }

  return {
    metrics: [
      { label: "Total Events", value: String(eventsCount), delta: "Live" },
      { label: "Registered Users", value: String(guestsCount), delta: "Live" },
      { label: "Tickets Generated", value: String(ticketsCount), delta: "Live" },
      { label: "Checked In", value: String(checkedInCount), delta: "Live" },
      { label: "Walk-In Guests", value: String(walkInCount), delta: "Live" },
      { label: "Pending ID Verification", value: String(pendingVerificationCount), delta: "Needs review" },
      { label: "Failed Verification", value: String(failedVerificationCount), delta: "Action needed" },
    ],
    guests: guests.slice(0, 10).map((guest) => ({
      id: guest.id,
      name: guest.fullName,
      category: guest.category.name,
      verification: titleCaseEnum(guest.idVerification?.status ?? VerificationStatus.NOT_STARTED),
      ticket: guest.ticket ? titleCaseEnum(guest.ticket.status) : "Not Generated",
    })),
    categoryData: summarizeByCategory(guests),
    events,
    trendData,
  };
}

export async function getUsersWithRoles() {
  const users = await prisma.user.findMany({
    include: {
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      permissionOverrides: { include: { permission: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.roles[0]?.role.name ?? "Unassigned",
    roleKey: user.roles[0]?.role.systemKey ?? "",
    status: user.status,
    effectivePermissions: (() => {
      const base = new Set(
        user.roles.flatMap((userRole) => userRole.role.permissions.map((rp) => rp.permission.key)),
      );
      for (const override of user.permissionOverrides) {
        if (override.granted) base.add(override.permission.key);
        else base.delete(override.permission.key);
      }
      return Array.from(base).sort();
    })(),
  }));
}

export async function getRolesWithPermissions() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      users: true,
    },
    orderBy: { name: "asc" },
  });
  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    systemKey: role.systemKey,
    description: role.description,
    userCount: role.users.length,
    permissionCount: role.permissions.length,
    permissions: role.permissions.map((rp) => rp.permission.key),
  }));
}

export async function getPermissionCatalog() {
  const permissions = await prisma.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] });
  return permissions.map((permission) => ({
    key: permission.key,
    label: permission.label,
    resource: permission.resource,
    action: permission.action,
  }));
}

function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function summarizeByCategory(
  guests: Array<{ category: { name: string } }>,
): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const guest of guests) {
    map.set(guest.category.name, (map.get(guest.category.name) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}
