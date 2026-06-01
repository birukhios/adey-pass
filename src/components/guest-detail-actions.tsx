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
    <div className="ap-form-shell">
      <section className="ap-form-section">
        <div>
          <h2 className="ap-form-title">Guest information</h2>
          <p className="ap-form-description">Update the invited person, organization, and protocol role used on invitations and tickets.</p>
        </div>
        <div className="ap-form-grid">
          <label className="ap-field-label">Full name<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, fullName: event.target.value }))} value={form.fullName} /></label>
          <label className="ap-field-label">Phone<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, phone: event.target.value }))} value={form.phone} /></label>
          <label className="ap-field-label">Email<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, email: event.target.value }))} value={form.email} /></label>
          <label className="ap-field-label">Organization<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, organization: event.target.value }))} value={form.organization} /></label>
          <label className="ap-field-label sm:col-span-2">Title / role<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, title: event.target.value }))} value={form.title} /></label>
        </div>
      </section>

      <section className="ap-form-section">
        <h2 className="ap-form-title">Internal notes</h2>
        <p className="ap-form-description">Private context for the operations team. This does not appear on public ticket pages.</p>
        <label className="ap-field-label mt-4">Notes<textarea className="ap-input" onChange={(event) => setForm((s) => ({ ...s, notes: event.target.value }))} value={form.notes} /></label>
      </section>

      {message ? <div className="ap-form-message">{message}</div> : null}

      <div className="ap-form-actions">
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <button className="ap-button-ghost" onClick={() => { void verificationDecision("approve"); }} type="button">Approve Verification</button>
          <button className="ap-button-ghost" onClick={() => { void verificationDecision("reject"); }} type="button">Reject Verification</button>
        </div>
        <button className="ap-button-primary disabled:opacity-60" disabled={loading} onClick={() => { void saveGuest(); }} type="button">{loading ? "Saving..." : "Save Guest"}</button>
      </div>
    </div>
  );
}
