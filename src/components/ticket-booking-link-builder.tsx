"use client";

import { useMemo, useState } from "react";
import { Copy, ExternalLink, Palette, Ticket } from "lucide-react";
import { Badge, Card } from "@/components/ui";

type TicketPreset = {
  id: string;
  label: string;
  accessType: string;
  primary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
};

const presets: TicketPreset[] = [
  { id: "general", label: "General", accessType: "General Admission", primary: "#FFD100", background: "#111418", surface: "#FFFFFF", text: "#111418", accent: "#5A5F66" },
  { id: "vip", label: "VIP", accessType: "VIP Access", primary: "#F4B000", background: "#0F0F0F", surface: "#FFF8D9", text: "#111418", accent: "#8A6A00" },
  { id: "media", label: "Media", accessType: "Media Access", primary: "#38BDF8", background: "#0F172A", surface: "#F8FAFC", text: "#0F172A", accent: "#2563EB" },
  { id: "staff", label: "Staff", accessType: "Staff Access", primary: "#22C55E", background: "#052E1A", surface: "#F0FDF4", text: "#052E1A", accent: "#166534" },
  { id: "protocol", label: "Protocol", accessType: "Protocol Access", primary: "#A855F7", background: "#1E1233", surface: "#FAF5FF", text: "#1E1233", accent: "#6B21A8" },
  { id: "security", label: "Security", accessType: "Security Access", primary: "#EF4444", background: "#2A0B0B", surface: "#FFF1F2", text: "#2A0B0B", accent: "#991B1B" },
];

const layouts = ["Mobile Pass", "Wide Ticket", "Badge Card"] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function TicketBookingLinkBuilder() {
  const [eventName, setEventName] = useState("Adey Launch Showcase");
  const [venue, setVenue] = useState("National Stadium");
  const [eventDate, setEventDate] = useState("May 25, 2026");
  const [eventTime, setEventTime] = useState("7:30 PM");
  const [guestName, setGuestName] = useState("Guest Name");
  const [organization, setOrganization] = useState("Adey Group");
  const [logoText, setLogoText] = useState("Adey Pass");
  const [footerText, setFooterText] = useState("Show this QR code at the gate.");
  const [ctaLabel, setCtaLabel] = useState("Book Your Ticket");
  const [instructionText, setInstructionText] = useState("Verify your Fayda ID, then download your QR ticket.");
  const [layout, setLayout] = useState<(typeof layouts)[number]>("Mobile Pass");
  const [brand, setBrand] = useState<TicketPreset>(presets[0]);

  const bookingToken = useMemo(() => {
    const eventSlug = slugify(eventName) || "event";
    const accessSlug = slugify(brand.accessType) || "ticket";
    return `${eventSlug}-${accessSlug}`;
  }, [brand.accessType, eventName]);

  const bookingLink = useMemo(() => {
    const params = new URLSearchParams({
      e: eventName,
      a: brand.accessType,
      logo: logoText,
      footer: footerText,
      cta: ctaLabel,
      p: brand.primary,
      bg: brand.background,
      text: brand.surface,
      acc: brand.accent,
    });
    return `http://localhost:3000/booking/${bookingToken}?${params.toString()}`;
  }, [bookingToken, brand, ctaLabel, eventName, footerText, logoText]);

  async function copyLink() {
    await navigator.clipboard.writeText(bookingLink);
  }

  function applyPreset(preset: TicketPreset) {
    setBrand(preset);
  }

  function updateBrand(next: Partial<TicketPreset>) {
    setBrand((current) => ({ ...current, id: "custom", label: "Custom", ...next }));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] xl:gap-6">
      <Card className="min-w-0 p-0">
        <div className="border-b p-4 sm:p-5" style={{ borderColor: "var(--stroke)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                <Palette size={15} />
                Ticket Designer
              </div>
              <h2 className="mt-2 text-xl font-black sm:text-2xl" style={{ color: "var(--text-strong)" }}>Build booking links by access type</h2>
            </div>
            <Badge tone="yellow">Live preview</Badge>
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:gap-6 sm:p-5">
          <section>
            <div className="mb-3 text-sm font-black" style={{ color: "var(--text-strong)" }}>Access color presets</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {presets.map((preset) => (
                <button
                  className="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5"
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  style={{
                    borderColor: brand.id === preset.id ? preset.primary : "var(--stroke)",
                    background: brand.id === preset.id ? "var(--surface-muted)" : "var(--surface)",
                    boxShadow: brand.id === preset.id ? `0 0 0 4px ${preset.primary}24` : "none",
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black" style={{ color: "var(--text-strong)" }}>{preset.label}</span>
                    <span className="size-4 rounded-full" style={{ background: preset.primary }} />
                  </div>
                  <div className="mt-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>{preset.accessType}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Event name<input className="ap-input" onChange={(event) => setEventName(event.target.value)} value={eventName} /></label>
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Venue<input className="ap-input" onChange={(event) => setVenue(event.target.value)} value={venue} /></label>
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Event date<input className="ap-input" onChange={(event) => setEventDate(event.target.value)} value={eventDate} /></label>
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Start time<input className="ap-input" onChange={(event) => setEventTime(event.target.value)} value={eventTime} /></label>
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Sample guest name<input className="ap-input" onChange={(event) => setGuestName(event.target.value)} value={guestName} /></label>
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Company / organization<input className="ap-input" onChange={(event) => setOrganization(event.target.value)} value={organization} /></label>
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Logo text<input className="ap-input" onChange={(event) => setLogoText(event.target.value)} value={logoText} /></label>
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>CTA label<input className="ap-input" onChange={(event) => setCtaLabel(event.target.value)} value={ctaLabel} /></label>
            <label className="grid gap-2 text-sm font-black sm:col-span-2" style={{ color: "var(--text-strong)" }}>Verification instruction<input className="ap-input" onChange={(event) => setInstructionText(event.target.value)} value={instructionText} /></label>
            <label className="grid gap-2 text-sm font-black sm:col-span-2" style={{ color: "var(--text-strong)" }}>Ticket footer<input className="ap-input" onChange={(event) => setFooterText(event.target.value)} value={footerText} /></label>
          </section>

          <section>
            <div className="mb-3 text-sm font-black" style={{ color: "var(--text-strong)" }}>Layout</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {layouts.map((item) => (
                <button className="rounded-2xl border px-4 py-3 text-sm font-black" key={item} onClick={() => setLayout(item)} style={{ borderColor: layout === item ? brand.primary : "var(--stroke)", background: layout === item ? "var(--surface-muted)" : "transparent", color: "var(--text-strong)" }} type="button">
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Primary<input className="ap-input h-12" onChange={(event) => updateBrand({ primary: event.target.value })} type="color" value={brand.primary} /></label>
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Background<input className="ap-input h-12" onChange={(event) => updateBrand({ background: event.target.value })} type="color" value={brand.background} /></label>
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Ticket surface<input className="ap-input h-12" onChange={(event) => updateBrand({ surface: event.target.value })} type="color" value={brand.surface} /></label>
            <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Accent<input className="ap-input h-12" onChange={(event) => updateBrand({ accent: event.target.value })} type="color" value={brand.accent} /></label>
          </section>

          <section className="rounded-3xl border p-4" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)" }}>
            <div className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>Booking link</div>
            <div className="mt-2 break-all text-sm font-bold" style={{ color: "var(--text-strong)" }}>{bookingLink}</div>
            <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
              <button className="ap-button-primary inline-flex min-h-11 items-center gap-2 px-4" onClick={copyLink} type="button"><Copy size={16} />Copy link</button>
              <a className="ap-button-ghost inline-flex min-h-11 items-center gap-2 px-4" href={bookingLink} rel="noreferrer" target="_blank"><ExternalLink size={16} />Open booking page</a>
            </div>
          </section>
        </div>
      </Card>

      <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-[2rem] p-4 shadow-2xl" style={{ background: brand.background }}>
          <div className="mb-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2 text-sm font-black">
              <Ticket size={18} style={{ color: brand.primary }} />
              {logoText}
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: brand.primary, color: brand.background }}>{brand.label}</span>
          </div>

          <div className={layout === "Wide Ticket" ? "rounded-3xl p-4 sm:p-5" : "mx-auto max-w-[320px] rounded-3xl p-4 sm:p-5"} style={{ background: brand.surface, color: brand.text }}>
            <div className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: brand.accent }}>{eventName}</div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <h3 className="break-words text-xl font-black leading-tight sm:text-2xl">{guestName}</h3>
                <p className="mt-1 text-sm font-black" style={{ color: brand.accent }}>{brand.accessType} · {organization}</p>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: brand.primary, color: brand.background }}>Verified</span>
            </div>
            <div className={layout === "Wide Ticket" ? "mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]" : "mt-5 grid gap-4"}>
              <div className="rounded-2xl border border-dashed p-4">
                <div className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: brand.accent }}>Event details</div>
                <div className="mt-3 space-y-2 text-sm font-bold">
                  <p>{eventDate} · {eventTime}</p>
                  <p>{venue}</p>
                  <p>{instructionText}</p>
                </div>
              </div>
              <div className="grid place-items-center rounded-2xl bg-white p-4 text-black">
                <div className="grid size-32 place-items-center rounded-xl border-4 border-black text-center text-xs font-black leading-5">
                  QR<br />AP26<br />PREVIEW
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs font-black">
              <span>AP26-{brand.id.toUpperCase()}-0427</span>
              <span style={{ color: brand.accent }}>{footerText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
