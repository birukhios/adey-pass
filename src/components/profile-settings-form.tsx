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
    <>
      <div className="mb-6 grid size-24 place-items-center rounded-full bg-[#FFD100] text-2xl font-black shadow-[0_12px_24px_-16px_rgba(255,209,0,0.9)]">
        {form.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
        <label className="ap-field-label">Name<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, name: event.target.value }))} value={form.name} /></label>
        <label className="ap-field-label">Email<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, email: event.target.value }))} value={form.email} /></label>
        <label className="ap-field-label">Phone<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, phone: event.target.value }))} value={form.phone} /></label>
        <label className="ap-field-label">New password<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, newPassword: event.target.value }))} type="password" value={form.newPassword} /></label>
      </div>
      {message ? <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">{message}</div> : null}
      <div className="mt-6 grid sm:flex"><button className="ap-button-primary disabled:opacity-60" disabled={loading} onClick={() => { void save(); }} type="button">{loading ? "Saving..." : "Save Profile"}</button></div>
    </>
  );
}
