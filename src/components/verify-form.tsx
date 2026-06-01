"use client";

import { useState } from "react";
export function VerifyForm({ token }: { token: string }) {
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("Ethiopian");
  const [currentAddress, setCurrentAddress] = useState("");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  async function sendOtp() {
    setSendingOtp(true);
    setOtpMessage("");
    const response = await fetch(`/api/verify/${token}/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, faydaNumber: idNumber }),
    });
    const result = await response.json();
    setSendingOtp(false);
    if (!response.ok) {
      setOtpMessage(result.message ?? "Could not send OTP.");
      return;
    }
    setOtpMessage(`OTP sent. Demo OTP: ${result.demoOtp}`);
  }

  async function submit() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/verify/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, idNumber, phone, otp, dateOfBirth, email, gender, nationality, currentAddress, consent }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.message ?? "Verification failed.");
      return;
    }
    setMessage(`Verified successfully (${result.status}).`);
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Full name<input className="ap-input" onChange={(event) => setFullName(event.target.value)} placeholder="Aster Girma" value={fullName} /></label>
      <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>National/Fayda ID number<input className="ap-input" onChange={(event) => setIdNumber(event.target.value)} placeholder="0000-0000-1234" value={idNumber} /></label>
      <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Phone number<input className="ap-input" onChange={(event) => setPhone(event.target.value)} placeholder="+251 911 111 111" value={phone} /></label>
      <button className="ap-button-ghost" disabled={sendingOtp || phone.trim().length < 8 || idNumber.trim().length < 8} onClick={() => { void sendOtp(); }} type="button">
        {sendingOtp ? "Sending OTP..." : "Send OTP"}
      </button>
      {otpMessage ? <div className="rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-strong)" }}>{otpMessage}</div> : null}
      <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>OTP code<input className="ap-input" onChange={(event) => setOtp(event.target.value)} placeholder="6-digit OTP" value={otp} /></label>
      <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Date of birth<input className="ap-input" onChange={(event) => setDateOfBirth(event.target.value)} type="date" value={dateOfBirth} /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Gender<select className="ap-input" onChange={(event) => setGender(event.target.value)} value={gender}><option value="">Not specified</option><option>Female</option><option>Male</option></select></label>
        <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Nationality<input className="ap-input" onChange={(event) => setNationality(event.target.value)} placeholder="Ethiopian" value={nationality} /></label>
      </div>
      <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Email optional<input className="ap-input" onChange={(event) => setEmail(event.target.value)} placeholder="guest@example.com" type="email" value={email} /></label>
      <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Current address<input className="ap-input" onChange={(event) => setCurrentAddress(event.target.value)} placeholder="Addis Ababa, Ethiopia" value={currentAddress} /></label>
      <label className="flex gap-3 rounded-2xl p-4 text-sm font-bold leading-6" style={{ background: "var(--surface-muted)", color: "var(--text-strong)" }}>
        <input className="mt-1 size-4 accent-[var(--adey-yellow)]" onChange={(event) => setConsent(event.target.checked)} type="checkbox" />
        I confirm that the information I provided is correct and I consent to identity verification for event access.
      </label>
      {message ? <div className="rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-strong)" }}>{message}</div> : null}
      <button className="ap-button-primary h-12 text-sm font-black disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "Submitting..." : "Submit Verification"}
      </button>
    </form>
  );
}
