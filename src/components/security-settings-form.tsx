"use client";

import { useState } from "react";

type SecurityValue = {
  idVerificationRequiredByDefault: boolean;
  walkInRegistrationAllowedByDefault: boolean;
  ticketExpiryRule: string;
  duplicateCheckinPrevention: boolean;
};

export function SecuritySettingsForm({ initial }: { initial: SecurityValue }) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const response = await fetch("/api/settings/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setLoading(false);
    setMessage(response.ok ? "Security settings saved." : (result.message ?? "Could not save security settings."));
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">ID verification required by default<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, idVerificationRequiredByDefault: event.target.value === "yes" }))} value={form.idVerificationRequiredByDefault ? "yes" : "no"}><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">Walk-in registration allowed by default<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, walkInRegistrationAllowedByDefault: event.target.value === "yes" }))} value={form.walkInRegistrationAllowedByDefault ? "yes" : "no"}><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">Ticket expiry rule<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, ticketExpiryRule: event.target.value }))} value={form.ticketExpiryRule}><option>At event close</option><option>24 hours after event</option><option>Manual only</option></select></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">Duplicate check-in prevention<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, duplicateCheckinPrevention: event.target.value === "enabled" }))} value={form.duplicateCheckinPrevention ? "enabled" : "disabled"}><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
      </div>
      {message ? <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-100">{message}</div> : null}
      <div className="mt-6"><button className="ap-button-primary disabled:opacity-60" disabled={loading} onClick={() => { void save(); }} type="button">{loading ? "Saving..." : "Save Security Settings"}</button></div>
    </>
  );
}
