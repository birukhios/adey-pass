"use client";

import dynamic from "next/dynamic";
import { Badge, Card, SelectField } from "@/components/ui";

const DashboardCharts = dynamic(() => import("@/components/dashboard-charts").then((module) => module.DashboardCharts), {
  loading: () => (
    <div className="mt-4 grid gap-4 lg:mt-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <div className="h-80 animate-pulse rounded-2xl" style={{ background: "var(--surface)" }} />
      <div className="h-80 animate-pulse rounded-2xl" style={{ background: "var(--surface)" }} />
    </div>
  ),
  ssr: false,
});

type Props = {
  metrics: Array<{ label: string; value: string; delta: string }>;
  trendData: Array<{ day: string; registrations: number; checkins: number }>;
  categoryData: Array<{ name: string; value: number }>;
  events: Array<{ id: string; name: string; registered: number; checkedIn: number }>;
  guests: Array<{ id: string; name: string; category: string; verification: string; ticket: string }>;
};

export function DashboardClient({ metrics, trendData, categoryData, events, guests }: Props) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="Event" options={["All events", ...events.map((event) => event.name)]} />
        <SelectField label="Date" options={["Last 7 days", "Today", "This month"]} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card className="relative min-w-0 overflow-hidden" key={metric.label}>
            <div className="absolute right-4 top-4 size-10 rounded-full" style={{ background: "color-mix(in oklab, var(--adey-yellow) 18%, transparent)" }} />
            <div className="text-sm font-black" style={{ color: "var(--text-muted)" }}>{metric.label}</div>
            <div className="mt-3 text-3xl font-black tracking-tight sm:mt-4 sm:text-4xl">{metric.value}</div>
            <div className="badge-live mt-3 inline-flex rounded-full px-2 py-1 text-xs font-black" style={{ background: "color-mix(in oklab, var(--ok) 12%, var(--surface))", color: "var(--ok)" }}>{metric.delta}</div>
          </Card>
        ))}
      </div>

      <DashboardCharts categoryData={categoryData} events={events} trendData={trendData} />

      <div className="mt-4 grid gap-4 lg:mt-6">
        <Card className="min-w-0">
          <h2 className="text-base font-black sm:text-lg">Recent Registered Guests</h2>
          <div className="ap-mobile-list mt-4">
            {guests.map((guest) => (
              <div className="ap-mobile-card" key={guest.id}>
                <div className="font-black">{guest.name}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold ap-soft-text">
                  <span>{guest.category}</span>
                  <span>{guest.verification}</span>
                  <span>{guest.ticket}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="ap-table-wrap ap-desktop-table mt-4">
            <table className="ap-table min-w-[620px]">
              <thead>
                <tr><th className="py-3">Guest</th><th>Category</th><th>Verification</th><th>Ticket</th></tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id}><td className="py-3 font-bold">{guest.name}</td><td>{guest.category}</td><td><Badge tone={guest.verification === "Pending" ? "yellow" : "green"}>{guest.verification}</Badge></td><td>{guest.ticket}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
