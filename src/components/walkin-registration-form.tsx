"use client";

import { useState } from "react";
import Image from "next/image";
import QRCodeLib from "qrcode";
import { Badge } from "@/components/ui";

export function WalkinRegistrationForm({ events }: { events: Array<{ id: string; name: string }> }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [faydaNumber, setFaydaNumber] = useState("");
  const [idType, setIdType] = useState("Fayda ID");
  const [otp, setOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState<"idle" | "sent" | "verified" | "failed">("idle");
  const [notice, setNotice] = useState("");
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
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
    setNotice(`OTP sent to ${phone}. Demo OTP: ${result.demoOtp}`);
  }

  function verifyOtp() {
    if (otpStatus !== "sent") {
      setNotice("Send OTP first.");
      return;
    }
    if (otp.trim()) {
      setOtpStatus("verified");
      setNotice("OTP added. It will be verified securely when you register.");
      return;
    }
    setOtpStatus("failed");
    setNotice("Enter the OTP first.");
  }

  async function registerWalkin(checkInImmediately: boolean) {
    if (otpStatus !== "verified") return;
    setSubmitting(true);
    const response = await fetch("/api/scanner/walkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phone,
        email,
        faydaNumber,
        idType,
        otp,
        eventId,
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
    setTicketId(nextTicketId);
    setNotice(`Walk-in registered. Ticket: ${nextTicketId}`);
    const image = await QRCodeLib.toDataURL(nextTicketId, { width: 220, margin: 1 });
    setQrDataUrl(image);
  }

  return (
    <div>
      <h2 className="text-lg font-black">Manual Add Walk-In</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-200">
          Full name
          <input
            className="ap-input"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Walk-in guest"
            value={fullName}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-200">
          Phone number
          <input
            className="ap-input"
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+251"
            value={phone}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-200">
          Email optional
          <input
            className="ap-input"
            onChange={(event) => setEmail(event.target.value)}
            value={email}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-200">
          Event
          <select className="ap-input" onChange={(event) => setEventId(event.target.value)} value={eventId}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-200">
          ID Type
          <select className="ap-input" onChange={(event) => setIdType(event.target.value)} value={idType}>
            <option>Fayda ID</option>
            <option>National ID</option>
            <option>Passport</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-200">
          ID Number (Required)
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              className="ap-input"
              onChange={(event) => setFaydaNumber(event.target.value)}
              placeholder="Required for verification"
              value={faydaNumber}
            />
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-black text-white disabled:opacity-50"
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

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-bold text-slate-200">
          OTP code
          <input
            className="ap-input"
            onChange={(event) => setOtp(event.target.value)}
            placeholder="Enter OTP"
            value={otp}
          />
        </label>
        <button
          className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-[#FFD100] px-4 text-sm font-black text-[#111418] disabled:opacity-50"
          disabled={otpStatus !== "sent" || !otp.trim()}
          onClick={verifyOtp}
          type="button"
        >
          Verify OTP
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm font-black text-slate-200">Verification:</span>
        {otpStatus === "verified" && <Badge tone="green">Verified</Badge>}
        {otpStatus === "sent" && <Badge tone="yellow">OTP Sent</Badge>}
        {otpStatus === "failed" && <Badge tone="red">Failed</Badge>}
        {otpStatus === "idle" && <Badge tone="neutral">Not Verified</Badge>}
      </div>

      {notice && <div className="mt-3 rounded-lg p-3 text-sm font-bold" style={{ background: "var(--surface-muted)", color: "var(--text-strong)" }}>{notice}</div>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="ap-button-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={otpStatus !== "verified" || !fullName.trim() || submitting}
          onClick={() => {
            void registerWalkin(false);
          }}
          type="button"
        >
          {submitting ? "Saving..." : "Generate Ticket"}
        </button>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-lg border px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={otpStatus !== "verified" || !fullName.trim() || submitting}
          onClick={() => {
            void registerWalkin(true);
          }}
          style={{ borderColor: "var(--surface-muted)" }}
          type="button"
        >
          Check In Immediately
        </button>
      </div>
      {ticketId && qrDataUrl ? (
        <div className="mt-5 rounded-lg border p-4" style={{ borderColor: "var(--surface-muted)", background: "var(--surface-muted)" }}>
          <div className="text-sm font-black text-emerald-400">Walk-In Ticket Ready</div>
          <div className="mt-2 text-lg font-black text-white">{ticketId}</div>
          <div className="mt-3 inline-flex rounded-lg bg-white p-2">
            <Image alt="Walk-in QR code" className="size-44" height={176} src={qrDataUrl} width={176} />
          </div>
          <p className="mt-3 text-sm text-slate-300">Show this QR immediately at the gate scanner.</p>
        </div>
      ) : null}
    </div>
  );
}
