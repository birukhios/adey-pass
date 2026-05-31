"use client";

import { useState } from "react";
import { Download, Filter } from "lucide-react";
import { Card } from "@/components/ui";

type Props = {
  rows: number;
  checkedIn: number;
  walkIns: number;
  pendingVerifications: number;
  failedVerifications: number;
  duplicateAttempts: number;
  organizationSubmissions: number;
  gates: Array<{ id: string; name: string }>;
};

export function ReportsClient({ rows, checkedIn, walkIns, pendingVerifications, failedVerifications, duplicateAttempts, organizationSubmissions, gates }: Props) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState("7");
  const [gateId, setGateId] = useState("all");
  const [status, setStatus] = useState("all");
  const dateRangeLabel = dateRange === "1" ? "Today" : dateRange === "30" ? "Last 30 days" : dateRange === "90" ? "Last 90 days" : "Last 7 days";
  const exportHref = `/api/reports/export?range=${dateRange}&gate=${gateId}&status=${status}`;

  const filters = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="grid gap-1 text-sm font-black" style={{ color: "var(--text-strong)" }}>
        Date range
        <select className="ap-input" onChange={(event) => setDateRange(event.target.value)} value={dateRange}>
          <option value="1">Today</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-black" style={{ color: "var(--text-strong)" }}>
        Gate
        <select className="ap-input" onChange={(event) => setGateId(event.target.value)} value={gateId}>
          <option value="all">All gates</option>
          {gates.map((gate) => (
            <option key={gate.id} value={gate.id}>
              {gate.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-black" style={{ color: "var(--text-strong)" }}>
        Status
        <select className="ap-input" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="all">All statuses</option>
          <option value="checked-in">Checked In</option>
          <option value="pending">Pending Verification</option>
          <option value="failed">Failed Verification</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-black" style={{ color: "var(--text-strong)" }}>
        Event
        <input className="ap-input" defaultValue="All events" />
      </label>
    </div>
  );

  return (
    <div className="grid gap-5">
      <Card className="hidden md:block">{filters}</Card>
      <div className="md:hidden">
        <button className="ap-button-ghost w-full" onClick={() => setMobileFiltersOpen(true)} type="button">
          <Filter size={16} />
          <span className="ml-2">Filters</span>
        </button>
        {mobileFiltersOpen ? (
          <div className="fixed inset-0 z-50 bg-black/40 p-4">
            <div className="ml-auto h-full w-[85%] overflow-y-auto rounded-lg p-4" style={{ background: "var(--surface)" }}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-black">Report Filters</h2>
                <button className="ap-button-ghost" onClick={() => setMobileFiltersOpen(false)} type="button">Close</button>
              </div>
              {filters}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <Card><div className="ap-kicker">Total Guests</div><div className="mt-2 text-3xl font-black">{rows}</div></Card>
        <Card><div className="ap-kicker">Checked In</div><div className="mt-2 text-3xl font-black">{checkedIn}</div></Card>
        <Card><div className="ap-kicker">Walk-Ins</div><div className="mt-2 text-3xl font-black">{walkIns}</div></Card>
        <Card><div className="ap-kicker">Pending Verification</div><div className="mt-2 text-3xl font-black">{pendingVerifications}</div></Card>
        <Card><div className="ap-kicker">Failed Verification</div><div className="mt-2 text-3xl font-black">{failedVerifications}</div></Card>
        <Card><div className="ap-kicker">Duplicate Scans</div><div className="mt-2 text-3xl font-black">{duplicateAttempts}</div></Card>
        <Card><div className="ap-kicker">Org Lists</div><div className="mt-2 text-3xl font-black">{organizationSubmissions}</div></Card>
      </div>

      <Card>
        <h2 className="text-xl font-black">Export Report</h2>
        <p className="mt-2 text-sm font-semibold ap-soft-text">Export unified report as CSV or PDF. Current range: <span className="font-black">{dateRangeLabel}</span>.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="ap-button-primary" href={exportHref}>
            <Download size={16} /> <span className="ml-2">Export CSV</span>
          </a>
          <button className="ap-button-ghost" type="button">Export PDF</button>
        </div>
      </Card>
    </div>
  );
}
