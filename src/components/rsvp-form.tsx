"use client";

import { useState } from "react";
import Link from "next/link";

export function RsvpForm({
  token,
  defaultPhone,
  defaultEmail,
}: {
  token: string;
  defaultPhone: string;
  defaultEmail: string;
}) {
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"ACCEPTED" | "DECLINED" | "">("");
  const [result, setResult] = useState<{ status: string; ticketLink?: string } | null>(null);
  const [message, setMessage] = useState("");

  async function submit(decision: "ACCEPTED" | "DECLINED") {
    setLoading(decision);
    setMessage("");
    const response = await fetch(`/api/rsvp/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, phone, email, notes }),
    });
    const data = await response.json();
    setLoading("");
    if (!response.ok) {
      setMessage(data.message ?? "Unable to save RSVP.");
      return;
    }
    setResult(data);
  }

  if (result) {
    return (
      <div className="mt-6 rounded-3xl border p-5" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)" }}>
        <p className="text-lg font-black">{result.status === "ACCEPTED" ? "RSVP confirmed" : "RSVP declined"}</p>
        {result.ticketLink ? (
          <Link className="ap-button-primary mt-4 w-full" href={result.ticketLink}>
            Open Ticket
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
        Phone
        <input className="ap-input" onChange={(event) => setPhone(event.target.value)} value={phone} />
      </label>
      <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
        Email optional
        <input className="ap-input" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
      </label>
      <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
        Notes optional
        <textarea className="ap-input min-h-24 py-3" onChange={(event) => setNotes(event.target.value)} value={notes} />
      </label>
      {message ? <div className="rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-strong)" }}>{message}</div> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="ap-button-primary" disabled={loading !== ""} onClick={() => { void submit("ACCEPTED"); }} type="button">
          {loading === "ACCEPTED" ? "Confirming..." : "Accept Invitation"}
        </button>
        <button className="ap-button-ghost" disabled={loading !== ""} onClick={() => { void submit("DECLINED"); }} type="button">
          {loading === "DECLINED" ? "Saving..." : "Decline"}
        </button>
      </div>
    </div>
  );
}
