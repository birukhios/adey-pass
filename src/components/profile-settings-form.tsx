"use client";

import { useState } from "react";

export function ProfileSettingsForm({ initial }: { initial: { name: string; email: string; phone: string } }) {
  const [form, setForm] = useState({ ...initial, newPassword: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setLoading(false);
    setMessage(response.ok ? "Profile updated." : (result.message ?? "Could not update profile."));
  }

  return (
    <div className="ap-form-shell">
      <section className="ap-form-section">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-20 place-items-center rounded-2xl bg-[var(--adey-yellow)] text-xl font-bold text-white shadow-[0_12px_24px_-16px_rgba(11,125,227,0.62)]">
              {form.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="ap-form-title">General settings</h2>
              <p className="ap-form-description">Manage your profile information and password placeholder.</p>
            </div>
          </div>
          <button className="ap-button-ghost" type="button">Upload image</button>
        </div>
      </section>

      <section className="ap-form-section">
        <h2 className="ap-form-title">Personal information</h2>
        <div className="ap-form-grid">
          <label className="ap-field-label">Name<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, name: event.target.value }))} value={form.name} /></label>
          <label className="ap-field-label">Email<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, email: event.target.value }))} value={form.email} /></label>
          <label className="ap-field-label">Phone<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, phone: event.target.value }))} value={form.phone} /></label>
          <label className="ap-field-label">New password<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, newPassword: event.target.value }))} placeholder="Leave blank to keep current password" type="password" value={form.newPassword} /></label>
        </div>
      </section>

      {message ? <div className="ap-form-message">{message}</div> : null}
      <div className="ap-form-actions">
        <span className="text-sm font-semibold ap-soft-text">Profile changes update your admin account.</span>
        <button className="ap-button-primary disabled:opacity-60" disabled={loading} onClick={() => { void save(); }} type="button">{loading ? "Saving..." : "Save Profile"}</button>
      </div>
    </div>
  );
}
