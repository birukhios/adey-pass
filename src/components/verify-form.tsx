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
    <form className="ap-form-shell mt-6" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <section className="ap-form-section">
        <h2 className="ap-form-title">Fayda verification</h2>
        <p className="ap-form-description">Confirm your identity before the ticket becomes valid for gate entry.</p>
        <div className="ap-form-grid">
          <label className="ap-field-label">Full name<input className="ap-input" onChange={(event) => setFullName(event.target.value)} placeholder="Aster Girma" value={fullName} /></label>
          <label className="ap-field-label">National/Fayda ID number<input className="ap-input" onChange={(event) => setIdNumber(event.target.value)} placeholder="0000-0000-1234" value={idNumber} /></label>
          <label className="ap-field-label">Phone number<input className="ap-input" onChange={(event) => setPhone(event.target.value)} placeholder="+251 911 111 111" value={phone} /></label>
          <label className="ap-field-label">OTP code<input className="ap-input" onChange={(event) => setOtp(event.target.value)} placeholder="6-digit OTP" value={otp} /></label>
        </div>
      </section>
      <button className="ap-button-ghost" disabled={sendingOtp || phone.trim().length < 8 || idNumber.trim().length < 8} onClick={() => { void sendOtp(); }} type="button">
        {sendingOtp ? "Sending OTP..." : "Send OTP"}
      </button>
      {otpMessage ? <div className="ap-form-message">{otpMessage}</div> : null}
      <section className="ap-form-section">
        <h2 className="ap-form-title">Additional details</h2>
        <div className="ap-form-grid">
          <label className="ap-field-label">Date of birth<input className="ap-input" onChange={(event) => setDateOfBirth(event.target.value)} type="date" value={dateOfBirth} /></label>
          <label className="ap-field-label">Gender<select className="ap-input" onChange={(event) => setGender(event.target.value)} value={gender}><option value="">Not specified</option><option>Female</option><option>Male</option></select></label>
          <label className="ap-field-label">Nationality<input className="ap-input" onChange={(event) => setNationality(event.target.value)} placeholder="Ethiopian" value={nationality} /></label>
          <label className="ap-field-label">Email optional<input className="ap-input" onChange={(event) => setEmail(event.target.value)} placeholder="guest@example.com" type="email" value={email} /></label>
          <label className="ap-field-label sm:col-span-2">Current address<input className="ap-input" onChange={(event) => setCurrentAddress(event.target.value)} placeholder="Addis Ababa, Ethiopia" value={currentAddress} /></label>
        </div>
      </section>
      <label className="flex gap-3 rounded-2xl p-4 text-sm font-bold leading-6" style={{ background: "var(--surface-muted)", color: "var(--text-strong)" }}>
        <input className="mt-1 size-4 accent-[var(--adey-yellow)]" onChange={(event) => setConsent(event.target.checked)} type="checkbox" />
        I confirm that the information I provided is correct and I consent to identity verification for event access.
      </label>
      {message ? <div className="ap-form-message">{message}</div> : null}
      <button className="ap-button-primary h-12 text-sm font-bold disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "Submitting..." : "Submit Verification"}
      </button>
    </form>
  );
}
