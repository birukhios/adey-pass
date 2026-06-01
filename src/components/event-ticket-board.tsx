"use client";

import { useMemo, useState } from "react";
import { Copy, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { ticketDesigns, ticketLayouts } from "@/lib/ticket-designs";

type TicketType = {
  id?: string;
  name: string;
  accessType: string;
  quantity: number;
  designKey: string;
  layoutKey: string;
  primaryColor: string;
  accentColor: string;
  outlineColor: string;
  bookingToken?: string;
  issuedCount: number;
};

type EventTicketBoardRow = {
  id: string;
  name: string;
  stadium: string;
  date: string;
  ticketTypes: TicketType[];
};

export function EventTicketBoard({ initialEvents }: { initialEvents: EventTicketBoardRow[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState(initialEvents.find((event) => event.ticketTypes.length > 0)?.id ?? initialEvents[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId) ?? events[0], [events, selectedEventId]);
  const publicOrigin = typeof window === "undefined" ? "" : window.location.origin;

  function updateTicketType(index: number, next: Partial<TicketType>) {
    if (!selectedEvent) return;
    setEvents((current) =>
      current.map((event) =>
        event.id === selectedEvent.id
          ? {
              ...event,
              ticketTypes: event.ticketTypes.map((ticketType, itemIndex) => {
                if (itemIndex !== index) return ticketType;
                const design = next.designKey ? ticketDesigns.find((item) => item.key === next.designKey) : null;
                return {
                  ...ticketType,
                  ...next,
                  ...(design
                    ? {
                        accessType: design.accessType,
                        primaryColor: design.primaryColor,
                        accentColor: design.accentColor,
                        outlineColor: design.outlineColor,
                      }
                    : {}),
                };
              }),
            }
          : event,
      ),
    );
  }

  function addTicketType() {
    if (!selectedEvent) return;
    const design = ticketDesigns[0];
    setEvents((current) =>
      current.map((event) =>
        event.id === selectedEvent.id
          ? {
              ...event,
              ticketTypes: [
                ...event.ticketTypes,
                {
                  name: "New Ticket",
                  accessType: design.accessType,
                  quantity: 100,
                  designKey: design.key,
                  layoutKey: "mobile-pass",
                  primaryColor: design.primaryColor,
                  accentColor: design.accentColor,
                  outlineColor: design.outlineColor,
                  issuedCount: 0,
                },
              ],
            }
          : event,
      ),
    );
  }

  function removeTicketType(index: number) {
    if (!selectedEvent) return;
    setEvents((current) =>
      current.map((event) =>
        event.id === selectedEvent.id
          ? { ...event, ticketTypes: event.ticketTypes.filter((_, itemIndex) => itemIndex !== index) }
          : event,
      ),
    );
  }

  async function copyLink(ticketType: TicketType) {
    if (!ticketType.bookingToken) return;
    await navigator.clipboard.writeText(`${publicOrigin}/booking/${ticketType.bookingToken}`);
    setMessage(`Copied ${ticketType.name} booking link.`);
  }

  async function saveTicketTypes() {
    if (!selectedEvent) return;
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/events/${selectedEvent.id}/ticket-types`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketTypes: selectedEvent.ticketTypes.map((ticketType) => ({
          id: ticketType.id,
          name: ticketType.name,
          accessType: ticketType.accessType,
          quantity: ticketType.quantity,
          designKey: ticketType.designKey,
          layoutKey: ticketType.layoutKey,
          primaryColor: ticketType.primaryColor,
          accentColor: ticketType.accentColor,
          outlineColor: ticketType.outlineColor,
        })),
      }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(result.message ?? "Could not save ticket types.");
      return;
    }
    setEvents((current) =>
      current.map((event) =>
        event.id === selectedEvent.id
          ? {
              ...event,
              ticketTypes: result.ticketTypes.map((ticketType: TicketType, index: number) => ({
                ...selectedEvent.ticketTypes[index],
                ...ticketType,
              })),
            }
          : event,
      ),
    );
    setMessage("Ticket setup saved.");
  }

  if (!selectedEvent) {
    return <Card>No events available yet. Create an event first.</Card>;
  }

  return (
    <Card className="min-w-0">
      <div className="grid gap-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,360px)_auto] lg:items-end">
          <div>
            <p className="ap-kicker">Event Ticket Setup</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Ticket groups by event</h1>
            <p className="mt-2 text-sm font-semibold leading-6 ap-soft-text">Select an event, design ticket layouts, set quantities, and copy booking links from one workspace.</p>
          </div>
          <label className="ap-field-label">
            Event
            <select className="ap-input" onChange={(event) => setSelectedEventId(event.target.value)} value={selectedEvent.id}>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </label>
          <button className="ap-button-primary gap-2" onClick={saveTicketTypes} type="button">
            <Save size={16} />
            {saving ? "Saving..." : "Save Tickets"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="blue">{selectedEvent.stadium}</Badge>
          <Badge>{selectedEvent.date}</Badge>
          <Badge tone="yellow">{selectedEvent.ticketTypes.reduce((sum, ticketType) => sum + ticketType.quantity, 0).toLocaleString()} total capacity</Badge>
        </div>
        {message ? <div className="mt-4 rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)" }}>{message}</div> : null}

      <div className="grid gap-4 border-t pt-5" style={{ borderColor: "var(--stroke)" }}>
        {selectedEvent.ticketTypes.map((ticketType, index) => (
          <section className="rounded-3xl border p-3 sm:p-4" key={ticketType.id ?? `${ticketType.name}-${index}`} style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)" }}>
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(290px,360px)]">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <label className="ap-field-label">
                  Ticket name
                  <input className="ap-input" onChange={(event) => updateTicketType(index, { name: event.target.value })} value={ticketType.name} />
                </label>
                <label className="ap-field-label">
                  Quantity
                  <input className="ap-input" min={0} onChange={(event) => updateTicketType(index, { quantity: Number(event.target.value || 0) })} type="number" value={ticketType.quantity} />
                </label>
                <label className="ap-field-label sm:col-span-2">
                  Ticket design outline
                  <select className="ap-input" onChange={(event) => updateTicketType(index, { designKey: event.target.value })} value={ticketType.designKey}>
                    {ticketDesigns.map((design) => (
                      <option key={design.key} value={design.key}>{design.name}</option>
                    ))}
                  </select>
                </label>
                <label className="ap-field-label sm:col-span-2">
                  Ticket layout
                  <select className="ap-input" onChange={(event) => updateTicketType(index, { layoutKey: event.target.value })} value={ticketType.layoutKey}>
                    {ticketLayouts.map((layout) => (
                      <option key={layout.key} value={layout.key}>{layout.name}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-2 sm:col-span-2 xl:col-span-4 xl:flex xl:flex-wrap">
                  <button className="ap-button-ghost gap-2" disabled={!ticketType.bookingToken} onClick={() => { void copyLink(ticketType); }} type="button"><Copy size={16} /> Copy link</button>
                  <a className="ap-button-ghost gap-2" href={ticketType.bookingToken ? `/booking/${ticketType.bookingToken}` : "#"} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open link</a>
                  <button className="ap-button-ghost gap-2" onClick={() => removeTicketType(index)} type="button"><Trash2 size={16} /> Remove</button>
                </div>
                <div className="grid gap-3 sm:col-span-2 xl:col-span-4 sm:grid-cols-3">
                  <StatTile label="Allowed tickets" value={ticketType.quantity.toLocaleString()} />
                  <StatTile label="People on it" value={ticketType.issuedCount.toLocaleString()} />
                  <StatTile label="Available" value={Math.max(0, ticketType.quantity - ticketType.issuedCount).toLocaleString()} />
                </div>
                <div className="break-all rounded-2xl border p-3 text-xs font-bold ap-soft-text sm:col-span-2 xl:col-span-4" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>
                  {ticketType.bookingToken ? `/booking/${ticketType.bookingToken}` : "Save to generate booking link"}
                </div>
              </div>

              <TicketLayoutPreview eventName={selectedEvent.name} ticketType={ticketType} />
            </div>
          </section>
        ))}
      </div>

      <button className="ap-button-ghost gap-2 justify-self-start" onClick={addTicketType} type="button">
        <Plus size={16} />
        Add another ticket group
      </button>
      </div>
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs font-bold ap-soft-text">{label}</div>
    </div>
  );
}

function TicketLayoutPreview({ eventName, ticketType }: { eventName: string; ticketType: TicketType }) {
  const sharedHeader = (
    <>
      <div className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: ticketType.accentColor }}>{eventName}</div>
      <h3 className="mt-2 break-words text-2xl font-black">{ticketType.name}</h3>
      <p className="text-sm font-bold ap-soft-text">{ticketType.accessType}</p>
    </>
  );

  if (ticketType.layoutKey === "wide-ticket") {
    return (
      <div className="rounded-3xl border p-4" style={{ borderColor: ticketType.outlineColor, background: "var(--surface)" }}>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_104px]">
          <div>{sharedHeader}<div className="mt-6 h-2 rounded-full" style={{ background: ticketType.primaryColor }} /></div>
          <QrPreview color={ticketType.primaryColor} />
        </div>
      </div>
    );
  }

  if (ticketType.layoutKey === "badge-card") {
    return (
      <div className="overflow-hidden rounded-3xl border" style={{ borderColor: ticketType.outlineColor, background: "var(--surface)" }}>
        <div className="p-4 text-white" style={{ background: ticketType.outlineColor }}>
          <div className="text-xs font-black uppercase tracking-[0.18em]">Stadium Badge</div>
          <h3 className="mt-3 text-3xl font-black">{ticketType.name}</h3>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_104px]">
          <div>{sharedHeader}</div>
          <QrPreview color={ticketType.primaryColor} />
        </div>
      </div>
    );
  }

  if (ticketType.layoutKey === "minimal-qr") {
    return (
      <div className="rounded-3xl border p-4 text-center" style={{ borderColor: ticketType.outlineColor, background: "var(--surface)" }}>
        <QrPreview color={ticketType.primaryColor} large />
        <h3 className="mt-4 text-2xl font-black">{ticketType.name}</h3>
        <p className="text-sm font-bold ap-soft-text">{ticketType.accessType}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border p-4" style={{ borderColor: ticketType.outlineColor, background: "var(--surface)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>{sharedHeader}</div>
        <QrPreview color={ticketType.primaryColor} />
      </div>
      <div className="mt-5 rounded-2xl border p-3 text-xs font-black uppercase tracking-[0.16em]" style={{ borderColor: ticketType.primaryColor, color: ticketType.accentColor }}>
        Mobile Pass Layout
      </div>
    </div>
  );
}

function QrPreview({ color, large = false }: { color: string; large?: boolean }) {
  return (
    <div className="grid place-items-center rounded-2xl bg-white p-3 shadow-sm">
      <div className={large ? "grid size-36 place-items-center rounded-xl border-4 text-xs font-black leading-5" : "grid size-20 place-items-center rounded-xl border-4 text-xs font-black leading-5"} style={{ borderColor: color, color }}>
        QR
      </div>
    </div>
  );
}
