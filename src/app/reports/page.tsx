import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReportsClient } from "@/components/reports-client";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  await connection();
  const [rows, pendingVerifications, checkedIn, walkIns, failedVerifications, duplicateAttempts, organizationSubmissions, gates] = await Promise.all([
    prisma.guest.count(),
    prisma.idVerification.count({ where: { status: "PENDING" } }),
    prisma.checkin.count({ where: { result: "CHECKED_IN" } }),
    prisma.guest.count({ where: { source: "WALK_IN" } }),
    prisma.idVerification.count({ where: { status: "FAILED" } }),
    prisma.checkin.count({ where: { result: "DUPLICATE_ATTEMPT" } }),
    prisma.organizationSubmission.count(),
    prisma.gate.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell>
      <PageHeader title="Reports" description="Filter and export event access data across registration, invitations, verification, tickets, check-ins, walk-ins, and no-shows." />
      <ReportsClient
        checkedIn={checkedIn}
        failedVerifications={failedVerifications}
        duplicateAttempts={duplicateAttempts}
        gates={gates}
        organizationSubmissions={organizationSubmissions}
        pendingVerifications={pendingVerifications}
        rows={rows}
        walkIns={walkIns}
      />
    </AppShell>
  );
}
