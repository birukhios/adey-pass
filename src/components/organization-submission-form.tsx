"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type GuestDraft = {
  fullName: string;
  phone: string;
  email: string;
  categoryName: string;
  title: string;
  faydaLast4: string;
};

const blankGuest: GuestDraft = {
  fullName: "",
  phone: "",
  email: "",
  categoryName: "Protocol",
  title: "",
  faydaLast4: "",
};

export function OrganizationSubmissionForm({
  eventId,
  categories,
}: {
  eventId: string;
  categories: string[];
}) {
  const [organizationName, setOrganizationName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [guests, setGuests] = useState<GuestDraft[]>([{ ...blankGuest }]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateGuest(index: number, patch: Partial<GuestDraft>) {
    setGuests((current) => current.map((guest, i) => (i === index ? { ...guest, ...patch } : guest)));
  }

  async function submit() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/organization/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, organizationName, contactName, contactPhone, contactEmail, guests }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.message ?? "Could not submit guest list.");
      return;
    }
    setMessage(`Submitted ${result.guestCount} guests for admin review.`);
    setGuests([{ ...blankGuest }]);
  }

  return (
    <div className="mt-6 grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Organization<input className="ap-input" onChange={(event) => setOrganizationName(event.target.value)} value={organizationName} /></label>
        <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Contact name<input className="ap-input" onChange={(event) => setContactName(event.target.value)} value={contactName} /></label>
        <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Contact phone<input className="ap-input" onChange={(event) => setContactPhone(event.target.value)} value={contactPhone} /></label>
        <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Contact email optional<input className="ap-input" onChange={(event) => setContactEmail(event.target.value)} type="email" value={contactEmail} /></label>
      </div>

      <div className="grid gap-3">
        {guests.map((guest, index) => (
          <div className="rounded-3xl border p-4" key={index} style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)" }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-black">Guest {index + 1}</div>
              {guests.length > 1 ? (
                <button className="ap-button-ghost min-h-9 px-3" onClick={() => setGuests((current) => current.filter((_, i) => i !== index))} type="button">
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <input className="ap-input" onChange={(event) => updateGuest(index, { fullName: event.target.value })} placeholder="Full name" value={guest.fullName} />
              <input className="ap-input" onChange={(event) => updateGuest(index, { phone: event.target.value })} placeholder="Phone" value={guest.phone} />
              <input className="ap-input" onChange={(event) => updateGuest(index, { email: event.target.value })} placeholder="Email optional" value={guest.email} />
              <select className="ap-input" onChange={(event) => updateGuest(index, { categoryName: event.target.value })} value={guest.categoryName}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
              <input className="ap-input" onChange={(event) => updateGuest(index, { title: event.target.value })} placeholder="Title / role" value={guest.title} />
              <input className="ap-input" maxLength={4} onChange={(event) => updateGuest(index, { faydaLast4: event.target.value })} placeholder="Fayda last 4 optional" value={guest.faydaLast4} />
            </div>
          </div>
        ))}
      </div>

      <button className="ap-button-ghost w-fit gap-2" onClick={() => setGuests((current) => [...current, { ...blankGuest }])} type="button">
        <Plus size={16} />
        Add Guest
      </button>

      {message ? <div className="rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-strong)" }}>{message}</div> : null}

      <button className="ap-button-primary" disabled={loading || !organizationName.trim() || !contactName.trim() || !contactPhone.trim()} onClick={() => { void submit(); }} type="button">
        {loading ? "Submitting..." : "Submit Guest List"}
      </button>
    </div>
  );
}
