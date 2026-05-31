"use client";

import { useState } from "react";

type BrandingValue = {
  appName: string;
  organizationName: string;
  primaryColor: string;
  ticketFooterText: string;
};

export function BrandingSettingsForm({ initial }: { initial: BrandingValue }) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/settings/branding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.message ?? "Could not save branding.");
      return;
    }
    setMessage("Branding saved.");
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">App name<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, appName: event.target.value }))} value={form.appName} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Organization name<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, organizationName: event.target.value }))} value={form.organizationName} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Primary color<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, primaryColor: event.target.value }))} value={form.primaryColor} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Ticket footer text<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, ticketFooterText: event.target.value }))} value={form.ticketFooterText} /></label>
      </div>
      {message ? <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">{message}</div> : null}
      <div className="mt-6"><button className="ap-button-primary disabled:opacity-60" disabled={loading} onClick={() => { void submit(); }} type="button">{loading ? "Saving..." : "Save Branding"}</button></div>
    </>
  );
}
