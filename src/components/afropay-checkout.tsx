"use client";

import { CheckCircle2, LockKeyhole, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CheckoutData = {
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
  status: string;
};

const paymentTabs = ["Wallet", "Bank Payments", "Domestic Cards"];
const walletMethods = ["CBE Birr", "M-PESA", "telebirr", "Chapa", "Kacha"];

export function AfropayCheckout({ checkout }: { checkout: CheckoutData }) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("Wallet");
  const [selectedMethod, setSelectedMethod] = useState("telebirr");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const subtotal = checkout.amount;
  const discount = Math.round(checkout.amount * 0.11);
  const tax = Math.max(1, Math.round(checkout.amount * 0.07));
  const total = Math.max(0, subtotal - discount + tax);

  async function payNow() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/payments/${checkout.checkoutToken}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: selectedMethod }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.message ?? "Payment could not be completed.");
      return;
    }
    router.push(result.ticketUrl ?? `/payment/${checkout.checkoutToken}`);
    router.refresh();
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: "linear-gradient(135deg, var(--afropay-soft), #ffffff 45%, color-mix(in oklab, var(--afropay-blue) 7%, #ffffff))", color: "var(--afropay-ink)" }}>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-center">
        <section className="hidden lg:block">
          <p className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: "var(--afropay-blue)" }}>Powered by Afropay</p>
          <h1 className="mt-4 max-w-xl text-5xl font-black tracking-tight">Fast checkout for stadium ticket booking.</h1>
          <p className="mt-5 max-w-lg text-lg font-semibold leading-8 text-slate-500">Review the access pass, choose a local payment method, and complete a secure mock payment before the QR ticket is released.</p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Secure", "Local wallets", "Instant QR"].map((item) => (
              <div className="rounded-3xl border bg-white p-4 shadow-sm" key={item}>
                <CheckCircle2 className="size-5" style={{ color: "var(--afropay-blue)" }} />
                <div className="mt-3 text-sm font-black">{item}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-2 shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
          <div className="rounded-[1.6rem] border border-slate-100 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-8">
              <div className="text-4xl font-black tracking-tight" style={{ color: "var(--afropay-blue)" }}>Afropay</div>
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--afropay-blue)" }}>
                <LockKeyhole className="size-4" />
                Safe in Afropay
              </div>
            </div>

            <div className="px-5 py-6 sm:px-8">
              <h2 className="text-2xl font-bold">Review your cart</h2>
              <div className="mt-5 grid gap-3 text-sm sm:text-base">
                <PaymentRow label="Event" value={checkout.eventName} />
                <PaymentRow label="Ticket" value={`${checkout.ticketName} · ${checkout.accessType}`} />
                <PaymentRow label="Buyer" value={checkout.fullName} />
                {checkout.companyName ? <PaymentRow label="Company" value={checkout.companyName} /> : null}
              </div>
              <div className="my-5 border-t border-dashed border-slate-200" />
              <div className="grid gap-3 text-base">
                <PaymentRow label="Subtotal" value={`${checkout.currency} ${subtotal.toLocaleString()}`} />
                <PaymentRow label="Discount" value={`-${checkout.currency} ${discount.toLocaleString()}`} muted />
                <PaymentRow label="TAX" value={`+${checkout.currency} ${tax.toLocaleString()}`} muted />
              </div>
              <div className="my-5 border-t border-dashed border-slate-200" />
              <PaymentRow label="Total" value={`${checkout.currency} ${total.toLocaleString()}`} strong />

              <div className="mt-7 grid rounded-2xl border border-slate-100 bg-slate-50 p-1 sm:grid-cols-3">
                {paymentTabs.map((tab) => (
                  <button
                    className="h-12 rounded-xl text-sm font-bold transition"
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    style={selectedTab === tab ? { background: "var(--afropay-blue)", color: "#fff" } : { color: "#7A8497" }}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {walletMethods.map((method) => (
                  <button
                    className="h-16 rounded-xl border text-sm font-black transition"
                    key={method}
                    onClick={() => setSelectedMethod(method)}
                    style={selectedMethod === method ? { borderColor: "var(--afropay-blue)", boxShadow: "0 0 0 2px color-mix(in oklab, var(--afropay-blue) 18%, transparent)", color: "var(--afropay-blue)" } : { borderColor: "#E6EAF2", color: "#64748B" }}
                    type="button"
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex h-16 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-lg">🇪🇹</div>
                <div className="text-sm font-black">+251</div>
                <div className="min-w-0 flex-1 truncate text-xl font-semibold text-slate-500">{checkout.phone}</div>
                <Smartphone className="size-6" style={{ color: "var(--afropay-blue)" }} />
              </div>

              {message ? <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</div> : null}

              <button className="mt-6 h-14 w-full rounded-xl text-base font-black text-white shadow-lg shadow-blue-500/20" onClick={payNow} style={{ background: "var(--afropay-blue)" }} type="button">
                {loading ? "Processing..." : `PAY ${checkout.currency} ${total.toLocaleString()}`}
              </button>

              <p className="mx-auto mt-7 max-w-sm text-center text-sm font-medium leading-6 text-slate-400">Ensuring your financial and personal details are secure during every transaction.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PaymentRow({ label, value, muted = false, strong = false }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className={strong ? "text-xl font-black" : "font-medium text-slate-400"}>{label}</span>
      <span className={`${strong ? "text-xl font-black" : "font-semibold"} text-right ${muted ? "text-slate-700" : "text-slate-950"}`}>{value}</span>
    </div>
  );
}
