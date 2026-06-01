"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { stadiumOptions } from "@/components/stadium-selector";

type SecurityDefaults = {
  idVerificationRequiredByDefault: boolean;
  walkInRegistrationAllowedByDefault: boolean;
  ticketExpiryRule: string;
  duplicateCheckinPrevention: boolean;
};

export function EventCreateForm({
  gates,
  securityDefaults,
}: {
  gates: Array<{ id: string; name: string }>;
  securityDefaults: SecurityDefaults;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    venueName: stadiumOptions[0],
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    gateUsageEnabled: false,
    selectedGateIds: [] as string[],
    idVerificationRequired: true,
    walkInRegistrationAllowed: true,
    maxAttendees: "",
    status: "DRAFT",
    securityDefaults,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null,
      }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.message ?? "Could not create event.");
      return;
    }
    router.push(`/events/${result.id}`);
    router.refresh();
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
        <label className="ap-field-label">Event name<input className="ap-input" onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} value={form.name} /></label>
        <label className="ap-field-label">Stadium<select className="ap-input" onChange={(e) => setForm((s) => ({ ...s, venueName: e.target.value }))} value={form.venueName}>{stadiumOptions.map((stadium) => <option key={stadium}>{stadium}</option>)}</select></label>
        <label className="ap-field-label">Event date<input className="ap-input" onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} type="date" value={form.date} /></label>
        <label className="ap-field-label">Start time<input className="ap-input" onChange={(e) => setForm((s) => ({ ...s, startTime: e.target.value }))} type="time" value={form.startTime} /></label>
        <label className="ap-field-label">End time<input className="ap-input" onChange={(e) => setForm((s) => ({ ...s, endTime: e.target.value }))} type="time" value={form.endTime} /></label>
        <label className="ap-field-label">Status<select className="ap-input" onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} value={form.status}><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="CLOSED">Closed</option><option value="ARCHIVED">Archived</option></select></label>
        <label className="ap-field-label">Gate usage<select className="ap-input" onChange={(e) => setForm((s) => ({ ...s, gateUsageEnabled: e.target.value === "enabled" }))} value={form.gateUsageEnabled ? "enabled" : "disabled"}><option value="disabled">Disabled</option><option value="enabled">Enabled</option></select></label>
        <label className="ap-field-label">Selected gate<select className="ap-input" onChange={(e) => setForm((s) => ({ ...s, selectedGateIds: e.target.value ? [e.target.value] : [] }))} value={form.selectedGateIds[0] ?? ""}><option value="">No gate selected</option>{gates.map((gate) => <option key={gate.id} value={gate.id}>{gate.name}</option>)}</select></label>
        <label className="ap-field-label">ID verification required<select className="ap-input" onChange={(e) => setForm((s) => ({ ...s, idVerificationRequired: e.target.value === "yes" }))} value={form.idVerificationRequired ? "yes" : "no"}><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label className="ap-field-label">Walk-in registration allowed<select className="ap-input" onChange={(e) => setForm((s) => ({ ...s, walkInRegistrationAllowed: e.target.value === "yes" }))} value={form.walkInRegistrationAllowed ? "yes" : "no"}><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label className="ap-field-label">Max attendees<input className="ap-input" onChange={(e) => setForm((s) => ({ ...s, maxAttendees: e.target.value }))} type="number" value={form.maxAttendees} /></label>
      </div>
      <label className="ap-field-label mt-5">Description<textarea className="ap-input min-h-32 p-3" onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} value={form.description} /></label>
      <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Security Defaults For New Events</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">These settings are saved together with your event.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:gap-5">
          <label className="ap-field-label">ID verification required by default<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, securityDefaults: { ...s.securityDefaults, idVerificationRequiredByDefault: event.target.value === "yes" } }))} value={form.securityDefaults.idVerificationRequiredByDefault ? "yes" : "no"}><option value="yes">Yes</option><option value="no">No</option></select></label>
          <label className="ap-field-label">Walk-in registration allowed by default<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, securityDefaults: { ...s.securityDefaults, walkInRegistrationAllowedByDefault: event.target.value === "yes" } }))} value={form.securityDefaults.walkInRegistrationAllowedByDefault ? "yes" : "no"}><option value="yes">Yes</option><option value="no">No</option></select></label>
          <label className="ap-field-label">Ticket expiry rule<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, securityDefaults: { ...s.securityDefaults, ticketExpiryRule: event.target.value } }))} value={form.securityDefaults.ticketExpiryRule}><option>At event close</option><option>24 hours after event</option><option>Manual only</option></select></label>
          <label className="ap-field-label">Duplicate check-in prevention<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, securityDefaults: { ...s.securityDefaults, duplicateCheckinPrevention: event.target.value === "enabled" } }))} value={form.securityDefaults.duplicateCheckinPrevention ? "enabled" : "disabled"}><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
        </div>
      </div>
      {message ? <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">{message}</div> : null}
      <div className="mt-6 grid gap-3 sm:flex">
        <button className="ap-button-primary disabled:opacity-60" disabled={loading} onClick={() => { void onSubmit(); }} type="button">{loading ? "Saving..." : "Save Event"}</button>
      </div>
    </div>
  );
}
