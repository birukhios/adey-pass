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
  const directTicketType = await prisma.eventTicketType.findUnique({
    where: { bookingToken: token },
    include: { event: { include: { ticketTypes: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } } } },
  });
  const event = directTicketType?.event ?? await prisma.event.findUnique({
    where: { id: token },
    include: { ticketTypes: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  const ticketTypes = event?.ticketTypes ?? [];
  const fallbackTicketType = ticketTypes[0];
  const ticketType = directTicketType ?? fallbackTicketType;

  const eventName = event?.name ?? readValue(query.e, "Stadium Event");
  const accessType = ticketType?.accessType ?? readValue(query.a, "General Admission");
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
            {event ? `${event.venueName} · choose your ticket type below` : accessType}
          </p>
          <div className="mt-8 rounded-lg p-4" style={{ background: primary, color: background }}>
            <div className="text-sm font-black">Booking access</div>
            <div className="mt-1 text-xs font-bold">Token: {token}</div>
            <div className="mt-3 inline-flex rounded-full bg-white/18 px-3 py-1 text-xs font-black">
              {ticketTypes.some((item) => item.paymentRequired && item.priceAmount > 0) ? "Paid and free options" : paymentRequired && priceAmount > 0 ? `${currency} ${priceAmount.toLocaleString()} checkout` : "Free booking"}
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
            ticketTypes={ticketTypes.map((item) => ({
              id: item.id,
              name: item.name,
              accessType: item.accessType,
              paymentRequired: item.paymentRequired,
              priceAmount: item.priceAmount,
              currency: item.currency,
              primaryColor: item.primaryColor,
              accentColor: item.accentColor,
              outlineColor: item.outlineColor,
            }))}
            initialTicketTypeId={ticketType?.id}
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
