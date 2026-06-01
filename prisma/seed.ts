import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const permissions = [
  "dashboard:view",
  "events:manage",
  "guests:manage",
  "tickets:manage",
  "verification:approve",
  "scanner:use",
  "scanner:override",
  "walkins:create",
  "reports:view",
  "reports:export",
  "settings:manage",
  "users:manage",
];

const rolePermissions: Record<string, string[]> = {
  super_admin: permissions,
  event_admin: [
    "dashboard:view",
    "events:manage",
    "guests:manage",
    "tickets:manage",
    "verification:approve",
    "scanner:use",
    "walkins:create",
    "reports:view",
    "reports:export",
    "settings:manage",
    "users:manage",
  ],
  guest_manager: ["guests:manage", "tickets:manage"],
  gate_officer: ["scanner:use"],
  protocol_officer: ["dashboard:view", "guests:manage", "tickets:manage", "verification:approve", "scanner:use"],
  security_officer: ["scanner:use", "scanner:override", "walkins:create"],
  report_viewer: ["dashboard:view", "reports:view", "reports:export"],
};

async function main() {
  const passwordHash = await bcrypt.hash("AdeyPass@2026", 12);

  for (const key of permissions) {
    const [resource, action] = key.split(":");
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, label: key.replace(":", " "), resource, action },
    });
  }

  const roles = [
    ["super_admin", "Super Admin", "Full access to Stadium Management System"],
    ["event_admin", "Event Admin", "Manage events, guests, tickets, scanner, and reports"],
    ["guest_manager", "Guest Manager", "Manage invited guests and ticket links"],
    ["gate_officer", "Gate Officer", "Scan tickets and register allowed walk-ins"],
    ["protocol_officer", "Protocol Officer", "Manage VIP and protocol guest access"],
    ["security_officer", "Security Officer", "Validate entry and support security overrides"],
    ["report_viewer", "Report Viewer", "View dashboard and reports"],
  ] as const;

  for (const [systemKey, name, description] of roles) {
    const role = await prisma.role.upsert({
      where: { systemKey },
      update: { name, description },
      create: { systemKey, name, description },
    });
    for (const permissionKey of rolePermissions[systemKey]) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  const users = [
    ["super@adeypass.local", "Selam Tesfaye", "super_admin"],
    ["events@adeypass.local", "Nahom Bekele", "event_admin"],
    ["gate@adeypass.local", "Hana Alemu", "gate_officer"],
    ["protocol@adeypass.local", "Mahilet Desta", "protocol_officer"],
    ["security@adeypass.local", "Biniam Getachew", "security_officer"],
    ["reports@adeypass.local", "Dawit Mekonnen", "report_viewer"],
  ] as const;

  for (const [email, name, roleKey] of users) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash, status: "ACTIVE" },
      create: { email, name, phone: "+251900000000", passwordHash, status: "ACTIVE" },
    });
    const role = await prisma.role.findUniqueOrThrow({ where: { systemKey: roleKey } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
  }

  const superAdmin = await prisma.user.findUniqueOrThrow({ where: { email: "super@adeypass.local" } });

  const categories = [
    ["VIP", "VIP Access", "#0B7DE3"],
    ["Media", "Media Access", "#5A5F66"],
    ["Staff", "Staff Access", "#111418"],
    ["Sponsor", "VIP Access", "#F59E0B"],
    ["Protocol", "VIP Access", "#0EA5E9"],
    ["Security", "Staff Access", "#EF4444"],
    ["Vendor", "General Admission", "#22C55E"],
    ["Emergency/Medical", "Staff Access", "#DC2626"],
    ["Special Guest", "VIP Access", "#A855F7"],
    ["Walk-In", "General Admission", "#64748B"],
  ] as const;

  for (const [name, accessType, color] of categories) {
    await prisma.guestCategory.upsert({
      where: { name },
      update: { accessType, color },
      create: { name, accessType, color },
    });
  }

  for (const gate of [
    ["Main Gate", "MAIN", "Primary guest entry"],
    ["VIP Gate", "VIP", "VIP and protocol access"],
    ["Media Gate", "MEDIA", "Press and media access"],
    ["Staff Gate", "STAFF", "Operations and staff access"],
    ["Emergency Gate", "EMERG", "Emergency and medical access"],
  ] as const) {
    await prisma.gate.upsert({
      where: { code: gate[1] },
      update: { name: gate[0], description: gate[2] },
      create: { name: gate[0], code: gate[1], description: gate[2], allowedCategories: [] },
    });
  }

  const templateData = {
    name: "Stadium Standard",
    isDefault: true,
    layoutJson: { accent: "#0B7DE3", mode: "registration-only", footer: "Show this QR code at the selected stadium gate." },
  };
  const existingTemplate = await prisma.ticketTemplate.findFirst({ where: { name: templateData.name } });
  const template = existingTemplate
    ? await prisma.ticketTemplate.update({ where: { id: existingTemplate.id }, data: templateData })
    : await prisma.ticketTemplate.create({ data: templateData });

  const eventData = {
    name: "National Stadium Inauguration",
    description: "Registration-only stadium event with VIP, media, staff, and walk-in access.",
    date: new Date("2026-06-20T00:00:00.000Z"),
    startTime: "18:00",
    endTime: "22:00",
    venueName: "National Stadium",
    status: "ACTIVE",
    gateUsageEnabled: true,
    idVerificationRequired: true,
    walkInRegistrationAllowed: true,
    ticketTemplateId: template.id,
    createdById: superAdmin.id,
  } as const;
  const existingEvent = await prisma.event.findFirst({ where: { name: eventData.name } });
  const event = existingEvent
    ? await prisma.event.update({ where: { id: existingEvent.id }, data: eventData })
    : await prisma.event.create({ data: eventData });

  const gates = await prisma.gate.findMany();
  for (const gate of gates) {
    await prisma.eventGate.upsert({
      where: { eventId_gateId: { eventId: event.id, gateId: gate.id } },
      update: {},
      create: { eventId: event.id, gateId: gate.id },
    });
  }

  const ticketTypes = [
    ["VVIP", "VVIP Access", 200, "vvip-blue", "badge-card", "#0B7DE3", "#075CAD", "#071B3D"],
    ["VIP", "VIP Access", 1000, "vip-gold", "mobile-pass", "#D6A600", "#8A6A00", "#111418"],
    ["Normal", "General Admission", 50000, "normal-silver", "wide-ticket", "#94A3B8", "#64748B", "#334155"],
  ] as const;

  for (const [name, accessType, quantity, designKey, layoutKey, primaryColor, accentColor, outlineColor] of ticketTypes) {
    await prisma.eventTicketType.upsert({
      where: { eventId_name: { eventId: event.id, name } },
      update: { accessType, quantity, designKey, layoutKey, primaryColor, accentColor, outlineColor },
      create: {
        eventId: event.id,
        name,
        accessType,
        quantity,
        designKey,
        layoutKey,
        primaryColor,
        accentColor,
        outlineColor,
        bookingToken: `${event.id.slice(-6)}-${name.toLowerCase()}`,
      },
    });
  }

  const sampleGuests = [
    ["Aster Girma", "+251911111111", "VIP", "Stadium Operations", "Board Guest", "INVITED"],
    ["Mikael Tadesse", "+251922222222", "Media", "Addis Daily", "Reporter", "INVITED"],
    ["Liya Kebede", "+251933333333", "Staff", "Stadium Ops", "Operations Lead", "INVITED"],
    ["Abel Fikru", "+251944444444", "Walk-In", "", "", "WALK_IN"],
  ] as const;

  for (const [fullName, phone, categoryName, organization, title, source] of sampleGuests) {
    const category = await prisma.guestCategory.findUniqueOrThrow({ where: { name: categoryName } });
    const guestData = {
        fullName,
        phone,
        categoryId: category.id,
        organization,
        title,
        source,
        registrationStatus: "REGISTERED",
      } as const;
    const existingGuest = await prisma.guest.findFirst({ where: { eventId: event.id, phone } });
    const guest = existingGuest
      ? await prisma.guest.update({ where: { id: existingGuest.id }, data: guestData })
      : await prisma.guest.create({ data: { eventId: event.id, ...guestData } });
    await prisma.invitation.upsert({
      where: { guestId: guest.id },
      update: {
        status: source === "WALK_IN" ? "ACCEPTED" : "SENT",
      },
      create: {
        guestId: guest.id,
        status: source === "WALK_IN" ? "ACCEPTED" : "SENT",
        token: `invite_${crypto.randomBytes(24).toString("base64url")}`,
      },
    });
    const existingTicket = await prisma.ticket.findUnique({
      where: { guestId: guest.id },
      include: { token: true },
    });
    const ticket = existingTicket ??
      await prisma.ticket.create({
        data: {
          guestId: guest.id,
          eventId: event.id,
          ticketId: `AP26-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
          accessType: category.accessType,
          status: "GENERATED",
        },
      });
    if (!existingTicket?.token) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.qrToken.create({
        data: {
          ticketId: ticket.id,
          tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
        },
      });
    }
  }

  await prisma.appSetting.upsert({
    where: { key: "branding" },
    update: {
      value: {
        appName: "Stadium Management System",
        primaryColor: "#0B7DE3",
        organizationName: "Stadium Operations",
        ticketFooterText: "Stadium Access & Gate Management",
        appearance: {
          theme: "System",
          cornerRadius: "Soft",
          density: "Comfortable",
          cardStyle: "Elevated",
          sidebarStyle: "Navy",
          ticketShape: "Rounded Pass",
        },
      },
      updatedById: superAdmin.id,
    },
    create: {
      key: "branding",
      value: {
        appName: "Stadium Management System",
        primaryColor: "#0B7DE3",
        organizationName: "Stadium Operations",
        ticketFooterText: "Stadium Access & Gate Management",
        appearance: {
          theme: "System",
          cornerRadius: "Soft",
          density: "Comfortable",
          cardStyle: "Elevated",
          sidebarStyle: "Navy",
          ticketShape: "Rounded Pass",
        },
      },
      updatedById: superAdmin.id,
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
