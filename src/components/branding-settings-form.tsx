"use client";

import { useState } from "react";

type BrandingValue = {
  appName: string;
  organizationName: string;
  primaryColor: string;
  ticketFooterText: string;
  appearance: {
    theme: string;
    cornerRadius: string;
    density: string;
    cardStyle: string;
    sidebarStyle: string;
    ticketShape: string;
  };
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
      <div className="grid gap-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:gap-5">
          <label className="ap-field-label">App name<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, appName: event.target.value }))} value={form.appName} /></label>
          <label className="ap-field-label">Organization name<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, organizationName: event.target.value }))} value={form.organizationName} /></label>
          <label className="ap-field-label">Primary color<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, primaryColor: event.target.value }))} value={form.primaryColor} /></label>
          <label className="ap-field-label">Ticket footer text<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, ticketFooterText: event.target.value }))} value={form.ticketFooterText} /></label>
        </section>

        <section className="rounded-3xl border p-4" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Detailed Appearance</h2>
              <p className="mt-1 text-sm font-semibold ap-soft-text">Control the product look for dashboards, forms, sidebars, and tickets.</p>
            </div>
            <div className="grid size-12 place-items-center rounded-2xl text-white" style={{ background: form.primaryColor }}>Aa</div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AppearanceSelect label="Theme" onChange={(value) => setForm((s) => ({ ...s, appearance: { ...s.appearance, theme: value } }))} options={["System", "Light", "Dark"]} value={form.appearance.theme} />
            <AppearanceSelect label="Corner radius" onChange={(value) => setForm((s) => ({ ...s, appearance: { ...s.appearance, cornerRadius: value } }))} options={["Compact", "Soft", "Round"]} value={form.appearance.cornerRadius} />
            <AppearanceSelect label="Density" onChange={(value) => setForm((s) => ({ ...s, appearance: { ...s.appearance, density: value } }))} options={["Compact", "Comfortable", "Spacious"]} value={form.appearance.density} />
            <AppearanceSelect label="Card style" onChange={(value) => setForm((s) => ({ ...s, appearance: { ...s.appearance, cardStyle: value } }))} options={["Flat", "Elevated", "Outlined"]} value={form.appearance.cardStyle} />
            <AppearanceSelect label="Sidebar style" onChange={(value) => setForm((s) => ({ ...s, appearance: { ...s.appearance, sidebarStyle: value } }))} options={["Navy", "Dark", "Light"]} value={form.appearance.sidebarStyle} />
            <AppearanceSelect label="Ticket shape" onChange={(value) => setForm((s) => ({ ...s, appearance: { ...s.appearance, ticketShape: value } }))} options={["Rounded Pass", "Wide Ticket", "Badge Card"]} value={form.appearance.ticketShape} />
          </div>
        </section>
      </div>
      {message ? <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">{message}</div> : null}
      <div className="mt-6 grid sm:flex"><button className="ap-button-primary disabled:opacity-60" disabled={loading} onClick={() => { void submit(); }} type="button">{loading ? "Saving..." : "Save Branding"}</button></div>
    </>
  );
}

function AppearanceSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <label className="ap-field-label">
      {label}
      <select className="ap-input" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}
