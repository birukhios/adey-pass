"use client";

import Link from "next/link";
import { AlertTriangle, Box, Briefcase, ChevronRight, Wallet } from "lucide-react";
import { StadiumCarousel } from "@/components/stadium-carousel";

type Props = {
  metrics: Array<{ label: string; value: string; delta: string }>;
  trendData: Array<{ day: string; registrations: number; checkins: number }>;
  categoryData: Array<{ name: string; value: number }>;
  events: Array<{ id: string; name: string; registered: number; checkedIn: number }>;
  guests: Array<{ id: string; name: string; category: string; verification: string; ticket: string }>;
};

export function DashboardClient({ metrics, events }: Props) {
  const heroCards = [
    { icon: Wallet, label: "Registered Users", value: metrics.find((metric) => metric.label === "Registered Users")?.value ?? "0", meta: "Total booking demand", href: "/guests" },
    { icon: Box, label: "Tickets Generated", value: metrics.find((metric) => metric.label === "Tickets Generated")?.value ?? "0", meta: "QR access issued", href: "/tickets" },
    { icon: Briefcase, label: "Pending Verification", value: metrics.find((metric) => metric.label === "Pending ID Verification")?.value ?? "0", meta: "Needs operations review", href: "/guests" },
    { icon: Wallet, label: "Checked In", value: metrics.find((metric) => metric.label === "Checked In")?.value ?? "0", meta: "Gate confirmed", href: "/scanner" },
  ];

  return (
    <>
      <StadiumCarousel />

      <section className="overflow-hidden rounded-[2rem] p-5 text-white shadow-[0_28px_90px_-48px_rgba(39,70,199,0.8)] sm:p-6" style={{ background: "radial-gradient(circle at 80% 0%, rgba(59,99,244,0.55), transparent 32%), linear-gradient(135deg, #07122f, #172a67 56%, #2549bc)" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Welcome Selam</h1>
            <p className="mt-2 text-sm font-medium text-white/58">Run invitations, payments, Fayda verification, and gate access from one control surface.</p>
          </div>
          <div className="grid gap-3 sm:min-w-72">
            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/52">
              Event
              <select className="h-11 rounded-xl border border-white/10 bg-white/10 px-3 text-sm font-bold normal-case tracking-normal text-white outline-none backdrop-blur">
                <option className="text-slate-950">All events</option>
                {events.map((event) => (
                  <option className="text-slate-950" key={event.id}>{event.name}</option>
                ))}
              </select>
            </label>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/74">
              <AlertTriangle className="size-4 text-amber-300" />
              Last updated a minute ago
            </div>
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
                <Link className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-white/80 transition hover:text-white" href={card.href}>View all <ChevronRight className="size-4" /></Link>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
