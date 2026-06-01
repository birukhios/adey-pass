"use client";

import { CheckCircle2, Download, LockKeyhole } from "lucide-react";
import QRCode from "react-qr-code";
import QRCodeLib from "qrcode";
import { useMemo, useState } from "react";

type PaymentReceiptData = {
  checkoutToken: string;
  reference: string;
  eventName: string;
  ticketName: string;
  accessType: string;
  fullName: string;
  companyName: string;
  phone: string;
  amount: number;
  currency: string;
  method: string;
  paidAt: string;
  status: string;
};

export function PaymentReceipt({ payment }: { payment: PaymentReceiptData }) {
  const [loading, setLoading] = useState(false);
  const qrPayload = useMemo(
    () =>
      JSON.stringify({
        provider: "Afropay",
        reference: payment.reference,
        eventName: payment.eventName,
        fullName: payment.fullName,
        accessType: payment.accessType,
        paidAt: payment.paidAt,
      }),
    [payment],
  );

  async function downloadPaidTicket() {
    setLoading(true);
    const qrDataUrl = await QRCodeLib.toDataURL(qrPayload, {
      margin: 2,
      color: { dark: "#171B26", light: "#FFFFFF" },
      width: 560,
    });
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#F6F8FC";
    ctx.fillRect(0, 0, 900, 1300);
    ctx.fillStyle = "#3B63F4";
    ctx.fillRect(44, 44, 812, 1212);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(84, 190, 732, 870);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 52px Arial";
    ctx.fillText("Afropay", 112, 122);
    ctx.font = "700 26px Arial";
    ctx.fillText("Paid Stadium Ticket", 112, 160);

    ctx.fillStyle = "#64748B";
    ctx.font = "700 24px Arial";
    ctx.fillText(payment.eventName.toUpperCase(), 126, 260);
    ctx.fillStyle = "#171B26";
    ctx.font = "700 56px Arial";
    ctx.fillText(payment.fullName, 126, 340);
    ctx.font = "700 30px Arial";
    ctx.fillText(`${payment.ticketName} · ${payment.accessType}`, 126, 390);
    ctx.fillStyle = "#3B63F4";
    ctx.font = "700 28px Arial";
    ctx.fillText(`${payment.currency} ${payment.amount.toLocaleString()} · ${payment.method}`, 126, 438);

    const image = new Image();
    image.src = qrDataUrl;
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    ctx.drawImage(image, 245, 500, 410, 410);

    ctx.fillStyle = "#171B26";
    ctx.font = "700 38px Arial";
    ctx.fillText(payment.reference, 126, 990);
    ctx.fillStyle = "#16A34A";
    ctx.font = "700 30px Arial";
    ctx.fillText("PAID · VALID FOR ENTRY", 126, 1038);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${payment.reference.toLowerCase()}-paid-ticket.png`;
    link.click();
    setLoading(false);
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: "linear-gradient(135deg, var(--afropay-soft), #ffffff 45%, color-mix(in oklab, var(--afropay-blue) 8%, #ffffff))", color: "var(--afropay-ink)" }}>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,440px)] lg:items-center">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
            <CheckCircle2 className="size-5" />
            Payment complete
          </div>
          <h1 className="mt-5 max-w-xl text-4xl font-black tracking-tight sm:text-6xl">Your QR ticket is ready.</h1>
          <p className="mt-5 max-w-lg text-base font-semibold leading-7 text-slate-500">The payment is recorded as an Afropay mock transaction. Download this pass and show the QR code at the gate.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <InfoTile label="Reference" value={payment.reference} />
            <InfoTile label="Method" value={payment.method || "Afropay"} />
            <InfoTile label="Amount" value={`${payment.currency} ${payment.amount.toLocaleString()}`} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-black tracking-tight" style={{ color: "var(--afropay-blue)" }}>Afropay</div>
            <LockKeyhole className="size-5" style={{ color: "var(--afropay-blue)" }} />
          </div>
          <div className="mt-6 rounded-3xl p-4" style={{ background: "var(--afropay-blue)" }}>
            <div className="rounded-2xl bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{payment.eventName}</div>
              <h2 className="mt-2 text-3xl font-black">{payment.fullName}</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">{payment.ticketName} · {payment.accessType}</p>
              <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-slate-200 p-5">
                <QRCode value={qrPayload} size={190} />
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-sm font-black">{payment.reference}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">Paid</span>
              </div>
            </div>
          </div>
          <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-white" onClick={downloadPaidTicket} style={{ background: "var(--afropay-blue)" }} type="button">
            <Download className="size-4" />
            {loading ? "Preparing..." : "Download Paid QR Ticket"}
          </button>
        </section>
      </div>
    </main>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="text-xs font-bold text-slate-400">{label}</div>
      <div className="mt-2 break-words text-sm font-black text-slate-950">{value}</div>
    </div>
  );
}
