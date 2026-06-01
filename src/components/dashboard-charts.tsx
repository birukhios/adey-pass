"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card } from "@/components/ui";

const colors = ["#0B7DE3", "#071B3D", "#5A5F66", "#94A3B8", "#22C55E"];

type Props = {
  trendData: Array<{ day: string; registrations: number; checkins: number }>;
  categoryData: Array<{ name: string; value: number }>;
  events: Array<{ id: string; name: string; registered: number; checkedIn: number }>;
};

export function DashboardCharts({ trendData, categoryData, events }: Props) {
  return (
    <>
      <div className="mt-4 grid gap-4 lg:mt-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Card className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-black sm:text-lg">Registration and Check-In Trend</h2>
            <Badge tone="yellow">Live data</Badge>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <Tooltip />
                <Area type="monotone" dataKey="registrations" stroke="var(--adey-yellow)" fill="var(--adey-yellow)" fillOpacity={0.35} />
                <Area type="monotone" dataKey="checkins" stroke="var(--text-strong)" fill="var(--text-strong)" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="min-w-0">
          <h2 className="text-base font-black sm:text-lg">Guest Category Breakdown</h2>
          <div className="mt-4 h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius="74%" innerRadius="42%">
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:mt-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <h2 className="text-base font-black sm:text-lg">Event Attendance Summary</h2>
          <div className="mt-4 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={events}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={12} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <Tooltip />
                <Bar dataKey="registered" fill="var(--adey-yellow)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="checkedIn" fill="var(--text-strong)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}
