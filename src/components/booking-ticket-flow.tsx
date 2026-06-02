"use client";

import { useMemo, useState } from "react";
import QRCode from "react-qr-code";
import QRCodeLib from "qrcode";

type BookingTicketFlowProps = {
  token: string;
  eventName: string;
  accessType: string;
  ctaLabel: string;
  primary: string;
  background: string;
  text: string;
  accent: string;
  paymentRequired: boolean;
  priceAmount: number;
  currency: string;
  ticketTypes?: Array<{
    id: string;
    name: string;
    accessType: string;
    paymentRequired: boolean;
    priceAmount: number;
    currency: string;
    primaryColor: string;
    accentColor: string;
    outlineColor: string;
  }>;
  initialTicketTypeId?: string;
};

export function BookingTicketFlow({
  token,
  eventName,
  accessType,
  ctaLabel,
  primary,
  background,
  text,
  accent,
  paymentRequired,
  priceAmount,
  currency,
  ticketTypes = [],
  initialTicketTypeId,
}: BookingTicketFlowProps) {
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState(initialTicketTypeId ?? ticketTypes[0]?.id ?? "");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [faydaNumber, setFaydaNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "failed">("idle");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [smsNotice, setSmsNotice] = useState("");
  const [error, setError] = useState("");
  const selectedTicketType = ticketTypes.find((item) => item.id === selectedTicketTypeId);
  const activeAccessType = selectedTicketType?.accessType ?? accessType;
  const activePaymentRequired = selectedTicketType ? selectedTicketType.paymentRequired && selectedTicketType.priceAmount > 0 : paymentRequired;
  const activePriceAmount = selectedTicketType?.priceAmount ?? priceAmount;
  const activeCurrency = selectedTicketType?.currency ?? currency;
  const activePrimary = selectedTicketType?.primaryColor ?? primary;
  const activeBackground = selectedTicketType?.outlineColor ?? background;
  const activeAccent = selectedTicketType?.accentColor ?? accent;

  const qrPayload = useMemo(
    () =>
      JSON.stringify({
        ticketId: ticketId || token,
        eventName,
        fullName,
        companyName,
        phone,
        accessType: activeAccessType,
        verifiedAt: new Date().toISOString(),
      }),
    [activeAccessType, companyName, eventName, fullName, phone, ticketId, token],
  );
  const previewTicketId = useMemo(() => {
    const clean = token.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const a = clean.slice(0, 4).padEnd(4, "X");
    const b = clean.slice(4, 8).padEnd(4, "X");
    const c = clean.slice(8, 12).padEnd(4, "X");
    return `AP26-${a}-${b}${c}`;
  }, [token]);

  function validateIdentityFields() {
    setError("");
    const cleanFayda = faydaNumber.replace(/[^0-9A-Za-z]/g, "");
    if (!fullName.trim()) {
      setError("Please add your full name.");
      return false;
    }
    if (!companyName.trim()) {
      setError("Please add your company name.");
      return false;
    }
    if (phone.replace(/[^0-9]/g, "").length < 8) {
      setError(activePaymentRequired ? "Please add the phone number you want to pay with." : "Please add your phone number.");
      return false;
    }
    if (cleanFayda.length < 8) {
      setError("Fayda number must be at least 8 characters.");
      return false;
    }
    if (!consent) {
      setError("Please accept the consent to continue.");
      return false;
    }
    return true;
  }

  async function sendBookingOtp() {
    if (!validateIdentityFields()) return;
    setStatus("verifying");
    setOtpMessage("");
    const response = await fetch("/api/bookings/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingToken: token,
        ticketTypeId: selectedTicketType?.id,
        phone,
        faydaNumber,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus("failed");
      setError(result.message ?? "Could not send OTP.");
      return;
    }
    setDemoOtp(result.demoOtp);
    setOtp(result.demoOtp);
    setOtpMessage(`OTP sent to ${phone}. Demo OTP: ${result.demoOtp}`);
    setStatus("idle");
  }

  function verifyIdentity() {
    if (!otp.trim()) {
      setError("Enter the OTP sent to your phone.");
      return;
    }
    if (demoOtp && otp.trim() !== demoOtp) {
      setStatus("failed");
      setError("Invalid OTP code.");
      return;
    }
    setError("");
    setOtpMessage("Fayda OTP verified. You can continue.");
    setStatus("verified");
  }

  async function continueToCheckout() {
    setCheckoutLoading(true);
    setError("");
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingToken: token,
        ticketTypeId: selectedTicketType?.id,
        fullName,
        companyName,
        phone,
        faydaNumber,
        otp,
      }),
    });
    const result = await response.json();
    setCheckoutLoading(false);
    if (!response.ok) {
      setError(result.message ?? "Could not create checkout.");
      return;
    }
    window.location.href = result.checkoutUrl;
  }

  async function completeFreeBooking() {
    setCheckoutLoading(true);
    setError("");
    const response = await fetch("/api/bookings/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingToken: token,
        ticketTypeId: selectedTicketType?.id,
        fullName,
        companyName,
        phone,
        faydaNumber,
        otp,
      }),
    });
    const result = await response.json();
    setCheckoutLoading(false);
    if (!response.ok) {
      setError(result.message ?? "Could not generate ticket.");
      return;
    }
    setTicketId(result.ticketId);
    setSmsNotice(result.sms ?? `SMS sent to ${phone} with your ticket link.`);
  }

  async function downloadTicketCard() {
    const qrDataUrl = await QRCodeLib.toDataURL(qrPayload, {
      margin: 2,
      color: { dark: "#111418", light: "#FFFFFF" },
      width: 560,
    });

    const canvas = document.createElement("canvas");
    const width = 900;
    const height = 1300;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Outer ticket shell
    ctx.fillStyle = "#0B1017";
    ctx.fillRect(0, 0, width, height);

    // Yellow frame
    ctx.fillStyle = "#0B7DE3";
    ctx.fillRect(38, 38, width - 76, height - 76);

    // Inner white body
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(78, 170, width - 156, height - 330);

    // Branding header
    ctx.fillStyle = "#111418";
    ctx.font = "700 46px Arial";
    ctx.fillText("Stadium Management System", 140, 116);
    ctx.font = "600 24px Arial";
    ctx.fillText("Stadium Access & Gate Management", 140, 150);

    // Content
    ctx.fillStyle = "#6B7280";
    ctx.font = "700 26px Arial";
    ctx.fillText(eventName.toUpperCase(), 120, 240);

    ctx.fillStyle = "#111418";
    ctx.font = "700 58px Arial";
    ctx.fillText(fullName, 120, 320);

    ctx.fillStyle = "#475569";
    ctx.font = "700 32px Arial";
    ctx.fillText(`${activeAccessType} · ${companyName}`, 120, 370);

    // QR box
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(120, 420, width - 240, 500);
    ctx.setLineDash([]);

    const qrImage = new Image();
    qrImage.src = qrDataUrl;
    await new Promise((resolve) => {
      qrImage.onload = resolve;
    });
    const qrSize = 370;
    ctx.drawImage(qrImage, width / 2 - qrSize / 2, 485, qrSize, qrSize);

    // Footer line
    ctx.fillStyle = "#111418";
    ctx.font = "700 42px Arial";
    ctx.fillText(ticketId || previewTicketId, 120, 995);

    // Verified pill
    const pillX = width - 300;
    const pillY = 950;
    const pillW = 170;
    const pillH = 56;
    const radius = 28;
    ctx.fillStyle = "#D1FAE5";
    ctx.beginPath();
    ctx.moveTo(pillX + radius, pillY);
    ctx.lineTo(pillX + pillW - radius, pillY);
    ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + radius);
    ctx.lineTo(pillX + pillW, pillY + pillH - radius);
    ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - radius, pillY + pillH);
    ctx.lineTo(pillX + radius, pillY + pillH);
    ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - radius);
    ctx.lineTo(pillX, pillY + radius);
    ctx.quadraticCurveTo(pillX, pillY, pillX + radius, pillY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#047857";
    ctx.font = "700 28px Arial";
    ctx.fillText("Verified", pillX + 26, pillY + 38);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${eventName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${fullName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-ticket-card.png`;
    link.click();
  }

  return (
    <div className="mt-6">
      {!started && (
        <button
          className="h-12 w-full rounded-lg text-sm font-black"
          onClick={() => setStarted(true)}
          style={{ background: activeBackground, color: text }}
          type="button"
        >
          {ctaLabel}
        </button>
      )}

      {started && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: activeAccent }}>
            Fayda Verification
          </p>
          <div className="mt-3 grid gap-3">
            {ticketTypes.length > 1 ? (
              <label className="ap-field-label">
                Ticket type
                <select className="ap-input" onChange={(event) => { setSelectedTicketTypeId(event.target.value); setStatus("idle"); setTicketId(""); setDemoOtp(""); setOtp(""); setOtpMessage(""); }} value={selectedTicketTypeId}>
                  {ticketTypes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.paymentRequired && item.priceAmount > 0 ? `${item.currency} ${item.priceAmount.toLocaleString()}` : "Free"}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="ap-field-label">
              Full name
              <input
                className="ap-input"
                onChange={(event) => setFullName(event.target.value)}
                value={fullName}
              />
            </label>
            <label className="ap-field-label">
              Company name
              <input
                className="ap-input"
                onChange={(event) => setCompanyName(event.target.value)}
                value={companyName}
              />
            </label>
            <label className="ap-field-label">
              Phone number
              <input
                className="ap-input"
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+251 9..."
                value={phone}
              />
            </label>
            <label className="ap-field-label">
              Fayda number
              <input
                className="ap-input"
                onChange={(event) => setFaydaNumber(event.target.value)}
                value={faydaNumber}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="ap-field-label">
                Fayda OTP
                <input
                  className="ap-input"
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Send OTP first"
                  value={otp}
                />
              </label>
              <button
                className="h-10 rounded-lg px-4 text-sm font-black text-white disabled:opacity-50 sm:mt-6"
                disabled={status === "verifying"}
                onClick={() => { void sendBookingOtp(); }}
                style={{ background: activePrimary }}
                type="button"
              >
                {status === "verifying" ? "Sending..." : "Send OTP"}
              </button>
            </div>
            <label className="flex items-start gap-2 text-sm font-bold text-slate-700">
              <input checked={consent} onChange={(event) => setConsent(event.target.checked)} type="checkbox" className="mt-1 size-4 accent-[var(--adey-yellow)]" />
              I confirm this information is correct and I consent to identity verification for event access.
            </label>
          </div>

          {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
          {otpMessage && <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm font-bold text-blue-700">{otpMessage}</div>}

          {status !== "verified" && (
            <button
              className="mt-4 h-11 w-full rounded-lg text-sm font-black"
              onClick={verifyIdentity}
              style={{ background: activePrimary, color: activeBackground }}
              type="button"
            >
              Verify Fayda OTP
            </button>
          )}

          {status === "verified" && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-black text-emerald-700">Verified. Your ticket card is ready.</p>
              {activePaymentRequired ? (
                <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-500">Payment required</div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-3xl font-black text-slate-950">{activeCurrency} {activePriceAmount.toLocaleString()}</div>
                      <div className="mt-1 text-sm font-bold text-slate-500">Powered by Afropay mock checkout</div>
                    </div>
                  </div>
                  <button
                    className="mt-4 h-11 w-full rounded-lg bg-[#3B63F4] text-sm font-black text-white"
                    onClick={continueToCheckout}
                    type="button"
                  >
                    {checkoutLoading ? "Preparing checkout..." : `Continue to Checkout`}
                  </button>
                </div>
              ) : (
              !ticketId ? (
                <button
                  className="mt-4 h-11 w-full rounded-lg text-sm font-black text-white"
                  onClick={completeFreeBooking}
                  style={{ background: activePrimary }}
                  type="button"
                >
                  {checkoutLoading ? "Generating ticket..." : "Generate QR Ticket"}
                </button>
              ) : (
              <div className="mt-4 rounded-xl bg-[#0B1017] p-4">
                <div className="rounded-xl bg-[var(--adey-yellow)] p-4">
                  <div className="text-xl font-black text-[var(--adey-charcoal)]">Stadium Management System</div>
                  <div className="text-xs font-bold text-[var(--adey-charcoal)]">Stadium Access & Gate Management</div>
                  <div className="mt-4 rounded-lg bg-white p-4">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{eventName}</div>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">{fullName}</h3>
                    <p className="text-sm font-bold text-slate-600">{activeAccessType} · {companyName}</p>
                    <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-slate-300 p-4">
                      <QRCode value={qrPayload} size={170} />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-black text-slate-900">{ticketId}</span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">Verified</span>
                    </div>
                  </div>
                </div>
                <button
                  className="mt-4 h-11 w-full rounded-lg text-sm font-black"
                  onClick={downloadTicketCard}
                  style={{ background: activeBackground, color: text }}
                  type="button"
                >
                  Download Ticket Card
                </button>
                {smsNotice ? <div className="mt-3 rounded-lg bg-white/10 p-3 text-sm font-bold text-white">{smsNotice}</div> : null}
              </div>
              )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
