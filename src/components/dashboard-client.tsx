"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card, SelectField } from "@/components/ui";

const colors = ["#FFD100", "#111418", "#5A5F66", "#94A3B8", "#22C55E"];

type Props = {
  metrics: Array<{ label: string; value: string; delta: string }>;
  trendData: Array<{ day: string; registrations: number; checkins: number }>;
  categoryData: Array<{ name: string; value: number }>;
  events: Array<{ id: string; name: string; registered: number; checkedIn: number }>;
  guests: Array<{ id: string; name: string; category: string; verification: string; ticket: string }>;
};

export function DashboardClient({ metrics, trendData, categoryData, events, guests }: Props) {
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="Event" options={["All events", ...events.map((event) => event.name)]} />
        <SelectField label="Date" options={["Last 7 days", "Today", "This month"]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card className="relative overflow-hidden" key={metric.label}>
            <div className="absolute right-4 top-4 size-10 rounded-full" style={{ background: "color-mix(in oklab, var(--adey-yellow) 18%, transparent)" }} />
            <div className="text-sm font-black" style={{ color: "var(--text-muted)" }}>{metric.label}</div>
            <div className="mt-4 text-4xl font-black tracking-tight">{metric.value}</div>
            <div className="badge-live mt-3 inline-flex rounded-full px-2 py-1 text-xs font-black" style={{ background: "color-mix(in oklab, var(--ok) 12%, var(--surface))", color: "var(--ok)" }}>{metric.delta}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">Registration and Check-In Trend</h2>
            <Badge tone="yellow">Live data</Badge>
          </div>
          <div className="h-80">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="registrations" stroke="var(--adey-yellow)" fill="var(--adey-yellow)" fillOpacity={0.35} />
                  <Area type="monotone" dataKey="checkins" stroke="var(--text-strong)" fill="var(--text-strong)" fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-2xl" style={{ background: "var(--surface-muted)" }} />
            )}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-black">Guest Category Breakdown</h2>
          <div className="mt-4 h-80">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={105} innerRadius={58}>
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-2xl" style={{ background: "var(--surface-muted)" }} />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-black">Recent Registered Guests</h2>
          <div className="ap-table-wrap mt-4">
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
        <Card>
          <h2 className="text-lg font-black">Event Attendance Summary</h2>
          <div className="mt-4 h-72">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={events}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="registered" fill="var(--adey-yellow)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="checkedIn" fill="var(--text-strong)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-2xl" style={{ background: "var(--surface-muted)" }} />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
