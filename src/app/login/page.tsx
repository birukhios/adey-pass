import { Suspense } from "react";
import { BadgeCheck, Building2, CalendarDays, QrCode, ShieldCheck } from "lucide-react";
import { AdeyLogo } from "@/components/adey-logo";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-40px)] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[700px] overflow-hidden rounded-[2rem] border p-8 text-white lg:flex lg:flex-col" style={{ borderColor: "color-mix(in oklab, var(--adey-yellow) 18%, transparent)", background: "radial-gradient(circle at 82% 8%, rgba(59,99,244,0.6), transparent 32%), linear-gradient(145deg, #07122f, #172a67 58%, #2549bc)", boxShadow: "var(--shadow-soft)" }}>
          <div className="absolute inset-x-8 top-28 h-px bg-white/10" />
          <div className="absolute -right-20 top-20 size-72 rounded-full" style={{ background: "color-mix(in oklab, var(--adey-yellow) 18%, transparent)", filter: "blur(30px)" }} />
          <div className="absolute bottom-10 left-10 right-10 h-52 rounded-[2rem] border border-white/10 bg-white/[0.04]" />
          <div className="relative z-10 flex items-center justify-between">
            <AdeyLogo theme="dark" />
            <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-white/70">Stadium workspace</div>
          </div>

          <div className="relative z-10 mt-20 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Stadium Management System</p>
            <h1 className="mt-5 text-6xl font-medium leading-[0.96] tracking-tight">Command center for stadium event days.</h1>
            <p className="mt-6 max-w-md text-base font-semibold leading-8 text-white/62">
              Select a stadium, manage invitations, verify Fayda IDs, issue QR tickets, and run gate scanning from one operations surface.
            </p>
          </div>

          <div className="relative z-10 mt-auto grid gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Building2, label: "Stadiums", value: "5" },
                { icon: QrCode, label: "Tickets", value: "12.1K" },
                { icon: BadgeCheck, label: "Checked In", value: "8.3K" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4" key={item.label}>
                    <Icon size={18} style={{ color: "var(--adey-yellow)" }} />
                    <div className="mt-4 text-2xl font-black">{item.value}</div>
                    <div className="mt-1 text-xs font-bold text-white/48">{item.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl" style={{ background: "var(--adey-yellow)", color: "var(--adey-charcoal)" }}>
                  <CalendarDays size={22} />
                </div>
                <div>
                  <div className="text-sm font-black">National Stadium Inauguration</div>
                  <div className="text-xs font-bold text-white/48">Live registration and gate scanner access</div>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full" style={{ background: "var(--adey-yellow)" }} />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[520px]">
          <div className="mb-8 lg:hidden">
            <AdeyLogo theme="light" />
          </div>
          <div className="rounded-[2rem] border p-6 shadow-[var(--shadow-card)] sm:p-8" style={{ borderColor: "var(--stroke)", background: "color-mix(in oklab, var(--surface) 94%, transparent)" }}>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="ap-kicker">Welcome Back</p>
                <h2 className="mt-3 text-4xl font-black leading-tight tracking-tight" style={{ color: "var(--text-strong)" }}>
                  Log in to Stadium Management
                </h2>
              </div>
              <div className="grid size-14 place-items-center rounded-2xl" style={{ background: "var(--surface-muted)", color: "var(--text-strong)" }}>
                <ShieldCheck size={24} />
              </div>
            </div>
            <Suspense fallback={<div className="mt-8 h-56 rounded-2xl" style={{ background: "var(--surface-muted)" }} />}>
              <LoginForm />
            </Suspense>
            <p className="mt-7 text-sm font-semibold leading-6" style={{ color: "var(--text-muted)" }}>
              First install?{" "}
              <a className="font-black" href="/setup" style={{ color: "color-mix(in oklab, var(--adey-yellow) 68%, var(--adey-charcoal))" }}>
                Create the first admin
              </a>
              .
            </p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {["Stadium ready", "QR secure", "Role based"].map((label) => (
              <div className="rounded-2xl border px-3 py-4 text-center text-xs font-black" key={label} style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>
                {label}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
