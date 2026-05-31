"use client";

import { useState } from "react";
import { Badge, Card } from "@/components/ui";

type SubmissionRow = {
  id: string;
  organizationName: string;
  contactName: string;
  contactPhone: string;
  status: string;
  submittedAt: Date | string;
  event: { name: string };
  guests: Array<{ id: string }>;
};

export function OrganizationSubmissionsCard({ initialRows }: { initialRows: SubmissionRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState("");

  async function approve(row: SubmissionRow) {
    setMessage("");
    const response = await fetch(`/api/organization/submissions/${row.id}/approve`, { method: "POST" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "Could not approve submission.");
      return;
    }
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: "APPROVED" } : item));
    setMessage(`Approved ${row.organizationName}. Created ${result.createdGuests} guests.`);
  }

  return (
    <Card>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black">Organization Submissions</h2>
          <p className="mt-1 text-sm font-semibold ap-soft-text">Review organization-provided guest lists and convert them into invited guests.</p>
        </div>
        <Badge tone="yellow">{rows.length} submissions</Badge>
      </div>
      {message ? <div className="mt-4 rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-strong)" }}>{message}</div> : null}
      <div className="ap-table-wrap mt-5">
        <table className="ap-table min-w-[840px]">
          <thead><tr><th>Organization</th><th>Event</th><th>Contact</th><th>Guests</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-black">{row.organizationName}</td>
                <td>{row.event.name}</td>
                <td><div className="font-bold">{row.contactName}</div><div className="text-xs font-semibold ap-soft-text">{row.contactPhone}</div></td>
                <td>{row.guests.length}</td>
                <td><Badge tone={row.status === "APPROVED" ? "green" : "yellow"}>{row.status}</Badge></td>
                <td>
                  <button className="ap-button-ghost min-h-9 px-3" disabled={row.status === "APPROVED"} onClick={() => { void approve(row); }} type="button">
                    Approve
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length ? <tr><td className="py-8 text-center font-bold ap-soft-text" colSpan={6}>No organization submissions yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
