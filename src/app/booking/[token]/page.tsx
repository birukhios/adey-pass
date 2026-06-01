import Link from "next/link";
import { connection } from "next/server";
import { BookingTicketFlow } from "@/components/booking-ticket-flow";
import { prisma } from "@/lib/prisma";

type BookingPageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined, fallback: string) {
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  await connection();
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const ticketType = await prisma.eventTicketType.findUnique({
    where: { bookingToken: token },
    include: { event: true },
  });

  const eventName = ticketType?.event.name ?? readValue(query.e, "Stadium Event");
  const accessType = ticketType?.accessType ?? readValue(query.a, "General Admission");
  const logoText = readValue(query.logo, "Stadium Management System");
  const footerText = readValue(query.footer, "Stadium Access & Gate Management");
  const ctaLabel = readValue(query.cta, "Book Your Ticket");
  const primary = ticketType?.primaryColor ?? readValue(query.p, "#0B7DE3");
  const background = ticketType?.outlineColor ?? readValue(query.bg, "#111418");
  const text = readValue(query.text, "#FFFFFF");
  const accent = ticketType?.accentColor ?? readValue(query.acc, "#5A5F66");
  const paymentRequired = ticketType?.paymentRequired ?? false;
  const priceAmount = ticketType?.priceAmount ?? 0;
  const currency = ticketType?.currency ?? "ETB";

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: "linear-gradient(180deg,#F4F6FB, #EEF2F8)", color: "#111418" }}>
      <div className="mx-auto max-w-lg">
        <section className="rounded-xl border p-6 shadow-[0_28px_52px_-30px_rgba(17,20,24,0.5)]" style={{ borderColor: "#E7EBF3", background: text, color: background }}>
          <div className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: accent }}>
            Booking Link
          </div>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{eventName}</h1>
          <p className="mt-2 text-sm font-bold" style={{ color: accent }}>
            {ticketType ? `${ticketType.name} · ${accessType} · ${ticketType.event.venueName}` : accessType}
          </p>
          <div className="mt-8 rounded-lg p-4" style={{ background: primary, color: background }}>
            <div className="text-sm font-black">{logoText}</div>
            <div className="mt-1 text-xs font-bold">Token: {token}</div>
            <div className="mt-3 inline-flex rounded-full bg-white/18 px-3 py-1 text-xs font-black">
              {paymentRequired && priceAmount > 0 ? `${currency} ${priceAmount.toLocaleString()} checkout` : "Free booking"}
            </div>
          </div>
          <BookingTicketFlow
            accessType={accessType}
            accent={accent}
            background={background}
            ctaLabel={ctaLabel}
            eventName={eventName}
            primary={primary}
            paymentRequired={paymentRequired && priceAmount > 0}
            priceAmount={priceAmount}
            currency={currency}
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
