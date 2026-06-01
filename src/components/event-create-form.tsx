"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { stadiumOptions } from "@/components/stadium-selector";
import { ticketDesigns, ticketLayouts } from "@/lib/ticket-designs";

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
  const defaultTicketTypes = [
    { name: "VVIP", quantity: "200", designKey: "vvip-blue", layoutKey: "badge-card", paymentRequired: true, priceAmount: "2500", currency: "ETB" },
    { name: "VIP", quantity: "1000", designKey: "vip-gold", layoutKey: "mobile-pass", paymentRequired: true, priceAmount: "1000", currency: "ETB" },
    { name: "Normal", quantity: "50000", designKey: "normal-silver", layoutKey: "wide-ticket", paymentRequired: true, priceAmount: "45", currency: "ETB" },
  ];
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
    ticketTypes: defaultTicketTypes,
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
        ticketTypes: form.ticketTypes.map((ticketType) => {
          const design = ticketDesigns.find((item) => item.key === ticketType.designKey) ?? ticketDesigns[0];
          return {
            name: ticketType.name,
            quantity: Number(ticketType.quantity || 0),
            designKey: design.key,
            layoutKey: ticketType.layoutKey,
            accessType: design.accessType,
            primaryColor: design.primaryColor,
            accentColor: design.accentColor,
            outlineColor: design.outlineColor,
            paymentRequired: ticketType.paymentRequired,
            priceAmount: Number(ticketType.priceAmount || 0),
            currency: ticketType.currency || "ETB",
          };
        }),
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Ticket Creation</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Create ticket groups for this event, choose a design outline, and set how many links can be booked.</p>
          </div>
          <button
            className="ap-button-ghost"
            onClick={() => setForm((s) => ({ ...s, ticketTypes: [...s.ticketTypes, { name: "New Ticket", quantity: "100", designKey: "normal-silver", layoutKey: "mobile-pass", paymentRequired: false, priceAmount: "0", currency: "ETB" }] }))}
            type="button"
          >
            Add Ticket Type
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {form.ticketTypes.map((ticketType, index) => {
            const design = ticketDesigns.find((item) => item.key === ticketType.designKey) ?? ticketDesigns[0];
            return (
              <div className="grid gap-3 rounded-2xl border p-3 lg:grid-cols-[minmax(0,1fr)_130px_minmax(180px,1fr)_minmax(180px,1fr)_130px_130px_auto]" key={`${ticketType.name}-${index}`} style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)" }}>
                <label className="ap-field-label">Ticket name<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, ticketTypes: s.ticketTypes.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} value={ticketType.name} /></label>
                <label className="ap-field-label">Quantity<input className="ap-input" min={0} onChange={(event) => setForm((s) => ({ ...s, ticketTypes: s.ticketTypes.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item) }))} type="number" value={ticketType.quantity} /></label>
                <label className="ap-field-label">Design outline<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, ticketTypes: s.ticketTypes.map((item, itemIndex) => itemIndex === index ? { ...item, designKey: event.target.value } : item) }))} value={ticketType.designKey}>{ticketDesigns.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label>
                <label className="ap-field-label">Ticket layout<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, ticketTypes: s.ticketTypes.map((item, itemIndex) => itemIndex === index ? { ...item, layoutKey: event.target.value } : item) }))} value={ticketType.layoutKey}>{ticketLayouts.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label>
                <label className="ap-field-label">Payment<select className="ap-input" onChange={(event) => setForm((s) => ({ ...s, ticketTypes: s.ticketTypes.map((item, itemIndex) => itemIndex === index ? { ...item, paymentRequired: event.target.value === "paid" } : item) }))} value={ticketType.paymentRequired ? "paid" : "free"}><option value="free">Free</option><option value="paid">Paid</option></select></label>
                <label className="ap-field-label">Price<input className="ap-input" min={0} onChange={(event) => setForm((s) => ({ ...s, ticketTypes: s.ticketTypes.map((item, itemIndex) => itemIndex === index ? { ...item, priceAmount: event.target.value } : item) }))} type="number" value={ticketType.priceAmount} /></label>
                <button className="ap-button-ghost self-end" onClick={() => setForm((s) => ({ ...s, ticketTypes: s.ticketTypes.filter((_, itemIndex) => itemIndex !== index) }))} type="button">Remove</button>
                <div className="rounded-2xl border p-4 lg:col-span-7" style={{ borderColor: design.outlineColor, background: "var(--surface)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: design.accentColor }}>{design.name}</div>
                      <div className="mt-1 text-xl font-black">{ticketType.name || "Ticket Type"}</div>
                      <div className="text-sm font-bold ap-soft-text">{design.accessType} · {ticketType.paymentRequired ? `${ticketType.currency} ${Number(ticketType.priceAmount || 0).toLocaleString()}` : "Free booking"}</div>
                    </div>
                    <div className="grid size-14 place-items-center rounded-2xl text-xs font-black text-white" style={{ background: design.primaryColor }}>QR</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
