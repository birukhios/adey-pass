import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

function csvEscape(value: string | number | null | undefined) {
  const input = String(value ?? "");
  if (input.includes(",") || input.includes('"') || input.includes("\n")) {
    return `"${input.replaceAll('"', '""')}"`;
  }
  return input;
}

export async function GET(request: Request) {
  const auth = await requirePermission(permissions.reportsExport);
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const range = Number(url.searchParams.get("range") ?? "7");
  const gate = url.searchParams.get("gate") ?? "all";
  const status = url.searchParams.get("status") ?? "all";
  const from = new Date();
  from.setDate(from.getDate() - Math.max(1, range));

  const [guests, checks, verifications, events, organizationSubmissions, gatePerformance] = await Promise.all([
    prisma.guest.findMany({
      include: { event: true, category: true, ticket: true, idVerification: true },
      where: { createdAt: { gte: from } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    prisma.checkin.findMany({
      include: { guest: true, event: true, ticket: true, gate: true },
      where: {
        checkedInAt: { gte: from },
        ...(gate !== "all" ? { gateId: gate } : {}),
        ...(status === "checked-in" ? { result: "CHECKED_IN" as const } : {}),
      },
      orderBy: { checkedInAt: "desc" },
      take: 5000,
    }),
    prisma.idVerification.findMany({
      include: { guest: true, event: true },
      where: {
        updatedAt: { gte: from },
        ...(status === "pending" ? { status: "PENDING" as const } : {}),
        ...(status === "failed" ? { status: "FAILED" as const } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.event.findMany({
      include: { guests: true, checkins: true },
      orderBy: { date: "asc" },
      take: 500,
    }),
    prisma.organizationSubmission.findMany({
      include: { event: true, guests: true },
      orderBy: { submittedAt: "desc" },
      take: 1000,
    }),
    prisma.gate.findMany({
      include: {
        checkins: {
          where: { checkedInAt: { gte: from } },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const csvLines: string[] = [];
  const pushRow = (values: Array<string | number | null | undefined>) => {
    csvLines.push(values.map((value) => csvEscape(value)).join(","));
  };
  const pushSection = (title: string) => {
    pushRow([`SECTION: ${title}`]);
  };
  const pushBlank = () => {
    csvLines.push("");
  };

  pushSection("Report Summary");
  pushRow(["Generated At", new Date().toISOString()]);
  pushRow(["Total Guests", guests.length]);
  pushRow(["Total Events", events.length]);
  pushRow(["Total Check-ins", checks.length]);
  pushRow(["Duplicate Scan Attempts", checks.filter((check) => check.result === "DUPLICATE_ATTEMPT").length]);
  pushRow(["Total Verifications", verifications.length]);
  pushRow(["Organization Submissions", organizationSubmissions.length]);
  pushBlank();

  pushSection("Guest Register");
  pushRow([
    "Guest Name",
    "Phone",
    "Email",
    "Event",
    "Category",
    "Source",
    "Registration",
    "Ticket",
    "Verification",
    "CheckIn",
  ]);
  for (const guest of guests) {
    pushRow([
      guest.fullName,
      guest.phone,
      guest.email ?? "",
      guest.event.name,
      guest.category.name,
      guest.source,
      guest.registrationStatus,
      guest.ticket?.status ?? "NOT_GENERATED",
      guest.idVerification?.status ?? "NOT_STARTED",
      guest.checkInStatus,
    ]);
  }
  pushBlank();

  pushSection("Verification Status");
  pushRow(["Guest", "Event", "Status", "Method", "Masked ID", "Verified At", "Updated At"]);
  for (const verification of verifications) {
    pushRow([
      verification.guest.fullName,
      verification.event.name,
      verification.status,
      verification.method,
      verification.maskedIdNumber,
      verification.verifiedAt?.toISOString() ?? "",
      verification.updatedAt.toISOString(),
    ]);
  }
  pushBlank();

  pushSection("Check-in Log");
  pushRow(["Guest", "Event", "Ticket ID", "Gate", "Result", "Method", "Checked In At"]);
  for (const check of checks) {
    pushRow([
      check.guest.fullName,
      check.event.name,
      check.ticket.ticketId,
      check.gate?.name ?? "",
      check.result,
      check.method,
      check.checkedInAt.toISOString(),
    ]);
  }
  pushBlank();

  pushSection("Gate Performance");
  pushRow(["Gate", "Code", "Checked In", "Duplicate Attempts", "Rejected"]);
  for (const gateRow of gatePerformance) {
    pushRow([
      gateRow.name,
      gateRow.code,
      gateRow.checkins.filter((check) => check.result === "CHECKED_IN").length,
      gateRow.checkins.filter((check) => check.result === "DUPLICATE_ATTEMPT").length,
      gateRow.checkins.filter((check) => check.result === "REJECTED").length,
    ]);
  }
  pushBlank();

  pushSection("Organization Submissions");
  pushRow(["Organization", "Event", "Contact", "Phone", "Status", "Guest Count", "Submitted At"]);
  for (const submission of organizationSubmissions) {
    pushRow([
      submission.organizationName,
      submission.event.name,
      submission.contactName,
      submission.contactPhone,
      submission.status,
      submission.guests.length,
      submission.submittedAt.toISOString(),
    ]);
  }
  pushBlank();

  pushSection("Event Attendance Summary");
  pushRow(["Event", "Date", "Status", "Registered", "Checked In"]);
  for (const event of events) {
    pushRow([
      event.name,
      event.date.toISOString(),
      event.status,
      event.guests.length,
      event.checkins.length,
    ]);
  }

  const csv = csvLines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="adey-pass-report.csv"`,
    },
  });
}
