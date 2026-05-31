import Link from "next/link";
import { BookingTicketFlow } from "@/components/booking-ticket-flow";

type BookingPageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined, fallback: string) {
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const [{ token }, query] = await Promise.all([params, searchParams]);

  const eventName = readValue(query.e, "Adey Event");
  const accessType = readValue(query.a, "General Admission");
  const logoText = readValue(query.logo, "Adey Pass");
  const footerText = readValue(query.footer, "Smart Event Access & Registration");
  const ctaLabel = readValue(query.cta, "Book Your Ticket");
  const primary = readValue(query.p, "#FFD100");
  const background = readValue(query.bg, "#111418");
  const text = readValue(query.text, "#FFFFFF");
  const accent = readValue(query.acc, "#5A5F66");

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: "linear-gradient(180deg,#F4F6FB, #EEF2F8)", color: "#111418" }}>
      <div className="mx-auto max-w-lg">
        <section className="rounded-xl border p-6 shadow-[0_28px_52px_-30px_rgba(17,20,24,0.5)]" style={{ borderColor: "#E7EBF3", background: text, color: background }}>
          <div className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: accent }}>
            Booking Link
          </div>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{eventName}</h1>
          <p className="mt-2 text-sm font-bold" style={{ color: accent }}>{accessType}</p>
          <div className="mt-8 rounded-lg p-4" style={{ background: primary, color: background }}>
            <div className="text-sm font-black">{logoText}</div>
            <div className="mt-1 text-xs font-bold">Token: {token}</div>
          </div>
          <BookingTicketFlow
            accessType={accessType}
            accent={accent}
            background={background}
            ctaLabel={ctaLabel}
            eventName={eventName}
            primary={primary}
            text={text}
            token={token}
          />
          <p className="mt-6 text-sm font-bold" style={{ color: accent }}>{footerText}</p>
          <div className="mt-6">
            <Link href="/login" className="text-sm font-black underline">Organizer Login</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
