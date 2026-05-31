"use client";

import { useState } from "react";

type Props = {
  guestId: string;
  initial: {
    fullName: string;
    phone: string;
    email: string;
    organization: string;
    title: string;
    notes: string;
  };
};

export function GuestDetailActions({ guestId, initial }: Props) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveGuest() {
    setLoading(true);
    const response = await fetch(`/api/guests/${guestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setLoading(false);
    setMessage(response.ok ? "Guest saved." : (result.message ?? "Could not save guest."));
  }

  async function verificationDecision(decision: "approve" | "reject") {
    const response = await fetch(`/api/verifications/${guestId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const result = await response.json();
    setMessage(response.ok ? `Verification ${result.status.replaceAll("_", " ")}.` : (result.message ?? "Could not update verification."));
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Full name<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, fullName: event.target.value }))} value={form.fullName} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Phone<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, phone: event.target.value }))} value={form.phone} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Email<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, email: event.target.value }))} value={form.email} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Organization<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, organization: event.target.value }))} value={form.organization} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Title / role<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, title: event.target.value }))} value={form.title} /></label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-700">Notes<textarea className="ap-input min-h-28 p-3" onChange={(event) => setForm((s) => ({ ...s, notes: event.target.value }))} value={form.notes} /></label>
      {message ? <div className="rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">{message}</div> : null}
      <div className="flex flex-wrap gap-3">
        <button className="ap-button-primary disabled:opacity-60" disabled={loading} onClick={() => { void saveGuest(); }} type="button">{loading ? "Saving..." : "Save Guest"}</button>
        <button className="ap-button-ghost" onClick={() => { void verificationDecision("approve"); }} type="button">Approve Verification</button>
        <button className="ap-button-ghost" onClick={() => { void verificationDecision("reject"); }} type="button">Reject Verification</button>
      </div>
    </div>
  );
}
