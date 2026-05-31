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
    ["super_admin", "Super Admin", "Full access to Adey Pass"],
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
      update: { name },
      create: { email, name, phone: "+251900000000", passwordHash },
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
    ["VIP", "VIP Access", "#FFD100"],
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

  const template = await prisma.ticketTemplate.create({
    data: {
      name: "Adey Standard",
      isDefault: true,
      layoutJson: { accent: "#FFD100", mode: "registration-only", footer: "Show this QR code at the gate." },
    },
  });

  const event = await prisma.event.create({
    data: {
      name: "Adey Launch Showcase",
      description: "Registration-only launch event with VIP, media, staff, and walk-in access.",
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
    },
  });

  const gates = await prisma.gate.findMany();
  for (const gate of gates) {
    await prisma.eventGate.create({ data: { eventId: event.id, gateId: gate.id } });
  }

  const sampleGuests = [
    ["Aster Girma", "+251911111111", "VIP", "Adey Group", "Board Guest", "INVITED"],
    ["Mikael Tadesse", "+251922222222", "Media", "Addis Daily", "Reporter", "INVITED"],
    ["Liya Kebede", "+251933333333", "Staff", "Adey Ops", "Operations Lead", "INVITED"],
    ["Abel Fikru", "+251944444444", "Walk-In", "", "", "WALK_IN"],
  ] as const;

  for (const [fullName, phone, categoryName, organization, title, source] of sampleGuests) {
    const category = await prisma.guestCategory.findUniqueOrThrow({ where: { name: categoryName } });
    const guest = await prisma.guest.create({
      data: {
        eventId: event.id,
        fullName,
        phone,
        categoryId: category.id,
        organization,
        title,
        source,
        registrationStatus: "REGISTERED",
      },
    });
    await prisma.invitation.create({
      data: {
        guestId: guest.id,
        status: source === "WALK_IN" ? "ACCEPTED" : "SENT",
        token: `invite_${crypto.randomBytes(24).toString("base64url")}`,
      },
    });
    const token = crypto.randomBytes(32).toString("hex");
    const ticket = await prisma.ticket.create({
      data: {
        guestId: guest.id,
        eventId: event.id,
        ticketId: `AP26-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        accessType: category.accessType,
        status: "GENERATED",
      },
    });
    await prisma.qrToken.create({
      data: {
        ticketId: ticket.id,
        tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      },
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "branding" },
    update: {},
    create: {
      key: "branding",
      value: {
        appName: "Adey Pass",
        primaryColor: "#FFD100",
        organizationName: "Adey Pass",
        ticketFooterText: "Smart Event Access & Registration",
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
