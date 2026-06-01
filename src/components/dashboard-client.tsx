"use client";

import dynamic from "next/dynamic";
import { AlertTriangle, Box, Briefcase, ChevronRight, Wallet } from "lucide-react";
import { StadiumCarousel } from "@/components/stadium-carousel";
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
  const heroCards = [
    { icon: Wallet, label: "Registered Users", value: metrics.find((metric) => metric.label === "Registered Users")?.value ?? "0", meta: "Total booking demand" },
    { icon: Box, label: "Tickets Generated", value: metrics.find((metric) => metric.label === "Tickets Generated")?.value ?? "0", meta: "QR access issued" },
    { icon: Briefcase, label: "Pending Verification", value: metrics.find((metric) => metric.label === "Pending ID Verification")?.value ?? "0", meta: "Needs operations review" },
    { icon: Wallet, label: "Checked In", value: metrics.find((metric) => metric.label === "Checked In")?.value ?? "0", meta: "Gate confirmed" },
  ];

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] p-5 text-white shadow-[0_28px_90px_-48px_rgba(39,70,199,0.8)] sm:p-6" style={{ background: "radial-gradient(circle at 80% 0%, rgba(59,99,244,0.55), transparent 32%), linear-gradient(135deg, #07122f, #172a67 56%, #2549bc)" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Welcome Selam</h1>
            <p className="mt-2 text-sm font-medium text-white/58">Run invitations, payments, Fayda verification, and gate access from one control surface.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/74">
            <AlertTriangle className="size-4 text-amber-300" />
            Last updated a minute ago
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {heroCards.map((card) => {
            const Icon = card.icon;
            return (
              <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" key={card.label}>
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-white/10 text-white/80"><Icon className="size-5" /></div>
                  <div className="text-sm font-semibold text-white/74">{card.label}</div>
                </div>
                <div className="mt-4 text-3xl font-black">{card.value}</div>
                <div className="mt-3 border-t border-white/10 pt-3 text-sm font-medium text-white/45">{card.meta}</div>
                <button className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-white/80" type="button">View all <ChevronRight className="size-4" /></button>
              </div>
            );
          })}
        </div>
      </section>

      <StadiumCarousel />

      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="Event" options={["All events", ...events.map((event) => event.name)]} />
        <SelectField label="Date" options={["Last 7 days", "Today", "This month"]} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card className="relative min-w-0 overflow-hidden" key={metric.label}>
            <div className="absolute right-4 top-4 size-10 rounded-2xl" style={{ background: "color-mix(in oklab, var(--adey-yellow) 10%, transparent)" }} />
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
