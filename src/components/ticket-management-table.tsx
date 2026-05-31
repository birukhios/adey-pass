"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, RotateCcw, Search, XCircle } from "lucide-react";
import { Badge, Card } from "@/components/ui";

type TicketStatus = "Generated" | "Sent" | "Used" | "Cancelled" | "Expired";
type VerificationStatus = "Verified" | "Pending" | "Failed" | "Not Started" | "Manually Approved";

type TicketRow = {
  id: string;
  name: string;
  access: string;
  invitation: string;
  status: TicketStatus;
  verification: VerificationStatus;
  ticketId: string;
  linkToken: string;
};

function statusTone(status: TicketStatus) {
  if (status === "Used") return "green";
  if (status === "Cancelled" || status === "Expired") return "red";
  return "yellow";
}

function verificationTone(status: VerificationStatus) {
  if (status === "Verified" || status === "Manually Approved") return "green";
  if (status === "Failed") return "red";
  return "yellow";
}

export function TicketManagementTable({ initialRows }: { initialRows: TicketRow[] }) {
  const [rows, setRows] = useState<TicketRow[]>(initialRows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [feedback, setFeedback] = useState("");

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const bySearch =
        !search.trim() ||
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.ticketId.toLowerCase().includes(search.toLowerCase());
      const byStatus = statusFilter === "All" || row.status === statusFilter;
      const byVerification = verificationFilter === "All" || row.verification === verificationFilter;
      return bySearch && byStatus && byVerification;
    });
  }, [rows, search, statusFilter, verificationFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(start, start + pageSize);

  function setMessage(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  async function copyLink(row: TicketRow) {
    const link = `http://localhost:3000/ticket/${row.linkToken}`;
    await navigator.clipboard.writeText(link);
    setMessage(`Copied ticket link for ${row.name}`);
  }

  async function regenerate(row: TicketRow) {
    try {
      const response = await fetch(`/api/tickets/${row.linkToken}/regenerate`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to regenerate ticket.");
      const updated = await response.json();
      setRows((current) =>
        current.map((item) =>
          item.linkToken === row.linkToken
            ? { ...item, ticketId: updated.ticketId, status: "Generated" }
            : item,
        ),
      );
      setMessage(`Regenerated ticket for ${row.name}`);
    } catch {
      setMessage("Could not regenerate ticket.");
    }
  }

  async function cancel(row: TicketRow) {
    try {
      const response = await fetch(`/api/tickets/${row.linkToken}/cancel`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to cancel ticket.");
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status: "Cancelled" } : item)));
      setMessage(`Cancelled ticket for ${row.name}`);
    } catch {
      setMessage("Could not cancel ticket.");
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black">Ticket Booking List</h2>
          <p className="mt-1 text-sm font-semibold ap-soft-text">Manage issued booking links, delivery actions, and ticket lifecycle states.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="yellow">{rows.filter((row) => row.status === "Generated").length} Generated</Badge>
          <Badge tone="green">{rows.filter((row) => row.status === "Used").length} Used</Badge>
          <Badge tone="red">{rows.filter((row) => row.status === "Cancelled").length} Cancelled</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_180px]">
        <label className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
          <input
            className="ap-input w-full pl-9 pr-3"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search guest or ticket ID"
            value={search}
          />
        </label>
        <select
          className="ap-input"
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          value={statusFilter}
        >
          <option>All</option>
          <option>Generated</option>
          <option>Sent</option>
          <option>Used</option>
          <option>Cancelled</option>
          <option>Expired</option>
        </select>
        <select
          className="ap-input"
          onChange={(event) => {
            setVerificationFilter(event.target.value);
            setPage(1);
          }}
          value={verificationFilter}
        >
          <option>All</option>
          <option>Verified</option>
          <option>Pending</option>
          <option>Failed</option>
          <option>Not Started</option>
          <option>Manually Approved</option>
        </select>
        <select
          className="ap-input"
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
          value={pageSize}
        >
          <option value={4}>4 per page</option>
          <option value={8}>8 per page</option>
          <option value={12}>12 per page</option>
        </select>
      </div>

      {feedback && <div className="mt-4 rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "color-mix(in oklab, var(--ok) 24%, transparent)", background: "color-mix(in oklab, var(--ok) 10%, var(--surface))", color: "var(--ok)" }}>{feedback}</div>}

      <div className="ap-table-wrap mt-5">
        <table className="ap-table min-w-[880px]">
          <thead>
            <tr>
              <th className="py-3">Guest</th>
              <th>Access</th>
              <th>Invitation Type</th>
              <th>Status</th>
              <th>Verification</th>
              <th className="w-60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id}>
                <td className="py-3">
                  <div className="font-black">{row.name}</div>
                  <div className="text-xs font-semibold ap-soft-text">{row.ticketId}</div>
                </td>
                <td>{row.access}</td>
                <td>{row.invitation}</td>
                <td><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                <td><Badge tone={verificationTone(row.verification)}>{row.verification}</Badge></td>
                <td>
                  <div className="flex gap-2">
                    <button className="grid size-10 place-items-center rounded-xl border transition hover:-translate-y-0.5" style={{ borderColor: "var(--stroke)", background: "var(--surface-elevated)" }} onClick={() => copyLink(row)} title="Copy link" type="button">
                      <Copy size={16} />
                    </button>
                    <button className="grid size-10 place-items-center rounded-xl border transition hover:-translate-y-0.5" style={{ borderColor: "var(--stroke)", background: "var(--surface-elevated)" }} onClick={() => regenerate(row)} title="Regenerate ticket" type="button">
                      <RotateCcw size={16} />
                    </button>
                    <button className="grid size-10 place-items-center rounded-xl border transition hover:-translate-y-0.5" style={{ borderColor: "var(--stroke)", background: "var(--surface-elevated)" }} onClick={() => cancel(row)} title="Cancel ticket" type="button">
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!paginatedRows.length && (
              <tr>
                <td className="py-8 text-center text-sm font-bold ap-soft-text" colSpan={6}>
                  No tickets found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-bold ap-soft-text">
          Showing {paginatedRows.length ? start + 1 : 0}-{Math.min(start + pageSize, filteredRows.length)} of {filteredRows.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="ap-button-ghost h-10 items-center gap-1 px-3 disabled:opacity-40"
            disabled={safePage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <div className="text-sm font-black" style={{ color: "var(--text-strong)" }}>Page {safePage} / {totalPages}</div>
          <button
            className="ap-button-ghost h-10 items-center gap-1 px-3 disabled:opacity-40"
            disabled={safePage >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            type="button"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
