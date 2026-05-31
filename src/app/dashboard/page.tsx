import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "@/components/dashboard-client";
import { PageHeader } from "@/components/page-header";
import { getDashboardData } from "@/lib/server-data";

export default async function DashboardPage() {
  await connection();
  const data = await getDashboardData();

  return (
    <AppShell>
      <PageHeader title="Dashboard" description="Live registration, verification, ticket, walk-in, and check-in visibility for registration-only events." />
      <DashboardClient
        categoryData={data.categoryData}
        events={data.events}
        guests={data.guests}
        metrics={data.metrics}
        trendData={data.trendData}
      />
    </AppShell>
  );
}
