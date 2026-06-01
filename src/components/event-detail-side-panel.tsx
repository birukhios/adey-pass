"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Save } from "lucide-react";
import { Badge } from "@/components/ui";

type EventSettings = {
  id: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";
  gateUsageEnabled: boolean;
  selectedGateIds: string[];
  idVerificationRequired: boolean;
  walkInRegistrationAllowed: boolean;
  maxAttendees: number | null;
};

type GateOption = {
  id: string;
  name: string;
};

export function EventDetailSidePanel({
  event,
  gates,
  generatedLink,
  organizationLink,
  qrDataUrl,
}: {
  event: EventSettings;
  gates: GateOption[];
  generatedLink: string;
  organizationLink: string;
  qrDataUrl: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...event,
    selectedGateId: event.selectedGateIds[0] ?? "",
    maxAttendees: event.maxAttendees?.toString() ?? "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(generatedLink);
    setMessage("Ticket link copied.");
  }

  async function copyQr() {
    if (!qrDataUrl) return;
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setMessage("QR code copied.");
    } catch {
      await navigator.clipboard.writeText(generatedLink);
      setMessage("QR image copy is not supported here, so the ticket link was copied.");
    }
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        gateUsageEnabled: form.gateUsageEnabled,
        selectedGateIds: form.selectedGateId ? [form.selectedGateId] : [],
        idVerificationRequired: form.idVerificationRequired,
        walkInRegistrationAllowed: form.walkInRegistrationAllowed,
        maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.message ?? "Could not save event settings.");
      return;
    }
    setMessage("Event settings saved.");
    router.refresh();
  }

  return (
    <div className="ap-form-shell min-w-0">
      <section className="ap-form-section">
        <div>
          <h2 className="ap-form-title">Public Booking Link & QR</h2>
          <p className="ap-form-description">One event link opens ticket type selection, Fayda verification, checkout when needed, and QR ticket generation.</p>
        </div>
        <div className="ap-copy-box mt-4">
          <div className="break-all text-sm font-bold">{generatedLink}</div>
          {qrDataUrl ? (
            <div className="mt-4 inline-flex rounded-xl bg-white p-2">
              <Image alt="Event ticket QR preview" className="size-40 rounded-lg sm:size-44" height={176} src={qrDataUrl} width={176} />
            </div>
          ) : null}
          <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
            <button className="ap-button-ghost min-h-9 gap-2 px-3" disabled={!qrDataUrl} onClick={copyQr} type="button">
              <Copy size={15} />
              Copy QR
            </button>
            <button className="ap-button-ghost min-h-9 gap-2 px-3" onClick={copyLink} type="button">
              <Copy size={15} />
              Copy Link
            </button>
          </div>
        </div>
      </section>

      <section className="ap-form-section">
        <h2 className="ap-form-title">Organization Submission Link</h2>
        <p className="ap-form-description">Use this when an organization needs to submit a list of important guests.</p>
        <div className="ap-copy-box mt-4">
          <div className="break-all text-sm font-bold">{organizationLink}</div>
          <button
            className="ap-button-ghost mt-4 min-h-9 w-full gap-2 px-3 sm:w-auto"
            onClick={async () => {
              await navigator.clipboard.writeText(organizationLink);
              setMessage("Organization submission link copied.");
            }}
            type="button"
          >
            <Copy size={15} />
            Copy Link
          </button>
        </div>
      </section>

      <section className="ap-form-section">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="ap-form-title">Event Settings</h2>
            <p className="ap-form-description">Control entry behavior without changing the event route or ticket records.</p>
          </div>
          <Badge tone={form.gateUsageEnabled ? "green" : "neutral"}>{form.gateUsageEnabled ? "Gates enabled" : "Gates disabled"}</Badge>
        </div>
        <div className="mt-4 grid gap-4 text-sm">
          <label className="ap-field-label">
            Status
            <select className="ap-input" onChange={(event) => setForm((state) => ({ ...state, status: event.target.value as EventSettings["status"] }))} value={form.status}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="ap-field-label">
            Gate usage
            <select className="ap-input" onChange={(event) => setForm((state) => ({ ...state, gateUsageEnabled: event.target.value === "enabled" }))} value={form.gateUsageEnabled ? "enabled" : "disabled"}>
              <option value="disabled">Disabled</option>
              <option value="enabled">Enabled</option>
            </select>
          </label>
          <label className="ap-field-label">
            Selected gate
            <select className="ap-input" disabled={!form.gateUsageEnabled} onChange={(event) => setForm((state) => ({ ...state, selectedGateId: event.target.value }))} value={form.selectedGateId}>
              <option value="">No gate selected</option>
              {gates.map((gate) => (
                <option key={gate.id} value={gate.id}>{gate.name}</option>
              ))}
            </select>
          </label>
          <label className="ap-field-label">
            ID verification
            <select className="ap-input" onChange={(event) => setForm((state) => ({ ...state, idVerificationRequired: event.target.value === "yes" }))} value={form.idVerificationRequired ? "yes" : "no"}>
              <option value="yes">Required</option>
              <option value="no">Optional</option>
            </select>
          </label>
          <label className="ap-field-label">
            Walk-in registration
            <select className="ap-input" onChange={(event) => setForm((state) => ({ ...state, walkInRegistrationAllowed: event.target.value === "yes" }))} value={form.walkInRegistrationAllowed ? "yes" : "no"}>
              <option value="yes">Allowed</option>
              <option value="no">Disabled</option>
            </select>
          </label>
          <label className="ap-field-label">
            Max attendees
            <input className="ap-input" min={1} onChange={(event) => setForm((state) => ({ ...state, maxAttendees: event.target.value }))} placeholder="No limit" type="number" value={form.maxAttendees} />
          </label>
        </div>
      </section>

      {message ? <div className="ap-form-message">{message}</div> : null}
      <div className="ap-form-actions">
        <span className="text-sm font-semibold ap-soft-text">Changes apply to this event only.</span>
        <button className="ap-button-primary gap-2 disabled:opacity-60" disabled={saving} onClick={saveSettings} type="button">
          <Save size={15} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
