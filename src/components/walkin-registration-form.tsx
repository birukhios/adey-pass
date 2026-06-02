"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCodeLib from "qrcode";
import { Badge } from "@/components/ui";

type WalkinEvent = {
  id: string;
  name: string;
  ticketTypes: Array<{
    id: string;
    name: string;
    accessType: string;
    bookingToken: string;
    paymentRequired: boolean;
    priceAmount: number;
    currency: string;
  }>;
};

export function WalkinRegistrationForm({ events }: { events: WalkinEvent[] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [faydaNumber, setFaydaNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState<"idle" | "sent" | "verified" | "failed">("idle");
  const [notice, setNotice] = useState("");
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const activeEvent = useMemo(() => events.find((event) => event.id === eventId) ?? events[0], [eventId, events]);
  const [ticketTypeId, setTicketTypeId] = useState(events[0]?.ticketTypes[0]?.id ?? "");
  const selectedTicketType = useMemo(
    () => activeEvent?.ticketTypes.find((ticketType) => ticketType.id === ticketTypeId) ?? activeEvent?.ticketTypes[0],
    [activeEvent, ticketTypeId],
  );
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  function canSendOtp() {
    return phone.trim().length >= 8 && faydaNumber.trim().length >= 8;
  }

  async function sendOtp() {
    if (!canSendOtp()) {
      setNotice("Phone and Fayda number are required before sending OTP.");
      return;
    }
    const response = await fetch("/api/scanner/walkin/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, faydaNumber }),
    });
    const result = await response.json();
    if (!response.ok) {
      setNotice(result.message ?? "Could not send OTP.");
      return;
    }
    setOtpStatus("sent");
    setDemoOtp(result.demoOtp);
    setOtp(result.demoOtp);
    setNotice(`OTP sent to ${phone}. Demo OTP: ${result.demoOtp}`);
  }

  function verifyOtp() {
    if (otpStatus !== "sent") {
      setNotice("Send OTP first.");
      return;
    }
    if (otp.trim() && (!demoOtp || otp.trim() === demoOtp)) {
      setOtpStatus("verified");
      setNotice("Fayda OTP verified. You can generate the walk-in ticket now.");
      return;
    }
    setOtpStatus("failed");
    setNotice("Enter the OTP shown after sending the code.");
  }

  async function registerWalkin(checkInImmediately: boolean) {
    if (otpStatus !== "verified") {
      setNotice("Verify the Fayda OTP before generating the ticket.");
      return;
    }
    if (selectedTicketType?.paymentRequired && selectedTicketType.priceAmount > 0) {
      setSubmitting(true);
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingToken: selectedTicketType.bookingToken,
          ticketTypeId: selectedTicketType.id,
          fullName,
          companyName: "Walk-in",
          phone,
          faydaNumber,
          otp,
        }),
      });
      const result = await response.json();
      setSubmitting(false);
      if (!response.ok) {
        setNotice(result.message ?? "Could not create walk-in checkout.");
        return;
      }
      setNotice("Checkout created. Redirecting to payment...");
      router.push(result.checkoutUrl);
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/scanner/walkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phone,
        email,
        faydaNumber,
        otp,
        eventId,
        eventTicketTypeId: selectedTicketType?.id,
        checkInImmediately,
      }),
    });
    const result = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setNotice(result.message ?? "Could not register walk-in.");
      return;
    }
    const nextTicketId = result.ticket.ticketId as string;
    const ticketUrl = (result.ticketUrl as string | undefined) ?? `/ticket/${result.ticket.id}`;
    setTicketId(nextTicketId);
    setNotice(result.sms ?? `SMS sent to ${phone} with your ticket link.`);
    const image = await QRCodeLib.toDataURL(JSON.stringify({ ticketId: nextTicketId }), { width: 220, margin: 1 });
    setQrDataUrl(image);
    router.push(ticketUrl);
  }

  return (
    <div className="walkin-dark-form min-w-0">
      <h2 className="text-lg font-black text-white">Manual Add Walk-In</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-white">
          Full name
          <input
            className="ap-input"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Walk-in guest"
            value={fullName}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-white">
          Phone number
          <input
            className="ap-input"
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+251"
            value={phone}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-white">
          Email optional
          <input
            className="ap-input"
            onChange={(event) => setEmail(event.target.value)}
            value={email}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-white">
          Event
          <select
            className="ap-input"
            onChange={(event) => {
              const nextEvent = events.find((item) => item.id === event.target.value);
              setEventId(event.target.value);
              setTicketTypeId(nextEvent?.ticketTypes[0]?.id ?? "");
            }}
            value={eventId}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-white">
          Ticket type
          <select className="ap-input" onChange={(event) => setTicketTypeId(event.target.value)} value={ticketTypeId}>
            {activeEvent?.ticketTypes.length ? activeEvent.ticketTypes.map((ticketType) => (
              <option key={ticketType.id} value={ticketType.id}>
                {ticketType.name} · {ticketType.paymentRequired && ticketType.priceAmount > 0 ? `${ticketType.currency} ${ticketType.priceAmount.toLocaleString()}` : "Free"}
              </option>
            )) : <option value="">General Admission · Free</option>}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-white">
          Fayda Number (Required)
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              className="ap-input"
              onChange={(event) => setFaydaNumber(event.target.value)}
              placeholder="Required for verification"
              value={faydaNumber}
            />
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-black text-white disabled:opacity-50"
              disabled={!canSendOtp()}
              onClick={() => { void sendOtp(); }}
              style={{ borderColor: "var(--surface-muted)" }}
              type="button"
            >
              Send OTP
            </button>
          </div>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="grid gap-2 text-sm font-bold text-white">
          OTP code
          <input
            className="ap-input"
            onChange={(event) => setOtp(event.target.value)}
            placeholder="Enter OTP"
            value={otp}
          />
        </label>
        <button
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--adey-yellow)] px-4 text-sm font-bold text-white disabled:opacity-50 sm:mt-7"
          disabled={otpStatus !== "sent" || !otp.trim()}
          onClick={verifyOtp}
          type="button"
        >
          Verify OTP
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-black text-white">Verification:</span>
        {otpStatus === "verified" && <Badge tone="green">Verified</Badge>}
        {otpStatus === "sent" && <Badge tone="yellow">OTP Sent</Badge>}
        {otpStatus === "failed" && <Badge tone="red">Failed</Badge>}
        {otpStatus === "idle" && <Badge tone="neutral">Not Verified</Badge>}
      </div>

      {notice && <div className="mt-3 rounded-lg p-3 text-sm font-bold" style={{ background: "var(--surface-muted)", color: "var(--text-strong)" }}>{notice}</div>}

      <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
        <button
          className="ap-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          disabled={otpStatus !== "verified" || !fullName.trim() || submitting}
          onClick={() => {
            void registerWalkin(false);
          }}
          type="button"
        >
          {submitting ? "Saving..." : selectedTicketType?.paymentRequired && selectedTicketType.priceAmount > 0 ? "Continue to Checkout" : "Generate Ticket"}
        </button>
        <button
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          disabled={otpStatus !== "verified" || !fullName.trim() || submitting}
          onClick={() => {
            void registerWalkin(true);
          }}
          style={{ borderColor: "var(--surface-muted)" }}
          type="button"
        >
          {selectedTicketType?.paymentRequired && selectedTicketType.priceAmount > 0 ? "Checkout & Check In Later" : "Check In Immediately"}
        </button>
      </div>
      {ticketId && qrDataUrl ? (
        <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--surface-muted)", background: "var(--surface-muted)" }}>
          <div className="text-sm font-black text-emerald-400">Walk-In Ticket Ready</div>
          <div className="mt-2 break-all text-lg font-black text-white">{ticketId}</div>
          <div className="mt-3 inline-flex max-w-full rounded-lg bg-white p-2">
            <Image alt="Walk-in QR code" className="size-44" height={176} src={qrDataUrl} width={176} />
          </div>
          <p className="mt-3 text-sm text-slate-300">Show this QR immediately at the gate scanner.</p>
        </div>
      ) : null}
    </div>
  );
}
