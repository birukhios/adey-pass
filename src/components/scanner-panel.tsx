"use client";

import { useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { Badge } from "@/components/ui";

type ScanTicket = {
  guest: { fullName: string; category: { name: string }; idVerification: { status: string } | null };
  event: { name: string };
  gate: { name: string } | null;
  status: string;
};

export function ScannerPanel({ gates }: { gates: Array<{ id: string; name: string }> }) {
  const [query, setQuery] = useState("");
  const [gateId, setGateId] = useState(gates[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ScanTicket | null>(null);
  const [loading, setLoading] = useState(false);

  const statusTone =
    message === "Allow Entry"
      ? "var(--ok)"
      : message === "Already Checked In" || message === "Verification Required"
        ? "var(--warn)"
        : message
          ? "var(--danger)"
          : "var(--text-muted)";

  async function lookupAndCheckin() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/scanner/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, gateId: gateId || undefined }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.status ?? data.message ?? "Could not process ticket.");
      setResult(data.ticket ?? null);
      return;
    }
    setMessage(data.status);
    setResult(data.ticket);
  }

  return (
    <div className="grid min-w-0 gap-4 rounded-[1.5rem] border p-4 sm:rounded-[1.75rem] sm:p-5" style={{ borderColor: "color-mix(in oklab, white 12%, transparent)", background: "color-mix(in oklab, white 7%, transparent)" }}>
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Fallback</div>
            <h2 className="mt-1 text-xl font-black text-white">Manual entry</h2>
          </div>
          <div className="grid size-10 place-items-center rounded-2xl" style={{ background: "color-mix(in oklab, var(--adey-yellow) 18%, transparent)", color: "var(--adey-yellow)" }}>
            <Search size={19} />
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2 text-sm font-black text-white/80">
            Ticket ID, token, phone, or name
            <input className="ap-input" onChange={(event) => setQuery(event.target.value)} placeholder="Enter ticket ID (example AP26-7X9K-PLB2)" value={query} />
          </label>
          <label className="grid gap-2 text-sm font-black text-white/80">
            Gate
            <select className="ap-input" onChange={(event) => setGateId(event.target.value)} value={gateId}>
              <option value="">Any gate</option>
              {gates.map((gate) => <option key={gate.id} value={gate.id}>{gate.name}</option>)}
            </select>
          </label>
          <button className="ap-button-primary min-h-12 w-full gap-2 disabled:opacity-60" disabled={!query.trim() || loading} onClick={() => { void lookupAndCheckin(); }} type="button">
            <CornerDownLeft size={16} />
            {loading ? "Checking..." : "Lookup and check in"}
          </button>
        </div>
      </div>
      {message ? <div className="rounded-2xl border p-3 text-sm font-black" style={{ borderColor: "color-mix(in oklab, white 12%, transparent)", background: "color-mix(in oklab, black 18%, transparent)", color: statusTone }}>{message}</div> : null}
      {result ? (
        <div className="min-w-0 rounded-3xl border p-4 sm:p-5" style={{ borderColor: "color-mix(in oklab, white 12%, transparent)", background: "color-mix(in oklab, black 18%, transparent)" }}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Manual result</p>
          <h2 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">{message || "Result"}</h2>
          <dl className="mt-5 grid gap-4 text-sm text-white">
            <div><dt className="font-bold text-white/45">Guest</dt><dd className="break-words font-black">{result.guest.fullName}</dd></div>
            <div><dt className="font-bold text-white/45">Event</dt><dd className="break-words font-black">{result.event.name}</dd></div>
            <div><dt className="font-bold text-white/45">Category</dt><dd><Badge tone="yellow">{result.guest.category.name}</Badge></dd></div>
            <div><dt className="font-bold text-white/45">ID verification</dt><dd><Badge tone={["VERIFIED", "MANUALLY_APPROVED"].includes(result.guest.idVerification?.status ?? "") ? "green" : "yellow"}>{result.guest.idVerification?.status?.replaceAll("_", " ") ?? "NOT STARTED"}</Badge></dd></div>
            <div><dt className="font-bold text-white/45">Gate</dt><dd className="font-black">{result.gate?.name ?? "Any Gate"}</dd></div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
