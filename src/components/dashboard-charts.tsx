"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card } from "@/components/ui";

const colors = ["#3B63F4", "#64748B", "#DDE3EC", "#55B870", "#F5B942"];

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
            <div>
              <h2 className="text-base font-black sm:text-lg">Total Activity</h2>
              <p className="mt-1 text-sm font-semibold ap-soft-text">Registration and check-in movement.</p>
            </div>
            <Badge tone="blue">Live data</Badge>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <Tooltip />
                <Area type="monotone" dataKey="registrations" stroke="var(--adey-yellow)" strokeWidth={3} fill="var(--adey-yellow)" fillOpacity={0.12} />
                <Area type="monotone" dataKey="checkins" stroke="#55B870" strokeWidth={2} fill="#55B870" fillOpacity={0.08} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="min-w-0">
          <h2 className="text-base font-black sm:text-lg">Payment Methods</h2>
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
                <Bar dataKey="registered" fill="var(--adey-yellow)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="checkedIn" fill="#55B870" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}
