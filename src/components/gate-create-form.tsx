"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GateCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/gates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, description }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.message ?? "Could not save gate.");
      return;
    }
    setName("");
    setCode("");
    setDescription("");
    setMessage("Gate saved.");
    router.refresh();
  }

  return (
    <div className="mt-4 grid gap-4">
      <label className="ap-field-label">Gate name<input className="ap-input" onChange={(event) => setName(event.target.value)} value={name} /></label>
      <label className="ap-field-label">Gate code<input className="ap-input" onChange={(event) => setCode(event.target.value)} value={code} /></label>
      <label className="ap-field-label">Description<input className="ap-input" onChange={(event) => setDescription(event.target.value)} value={description} /></label>
      {message ? <div className="rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">{message}</div> : null}
      <button className="ap-button-primary w-full disabled:opacity-60 sm:w-fit" disabled={loading} onClick={() => { void submit(); }} type="button">
        {loading ? "Saving..." : "Save Gate"}
      </button>
    </div>
  );
}
