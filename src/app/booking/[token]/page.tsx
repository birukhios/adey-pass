import Link from "next/link";
import { connection } from "next/server";
import { BookingTicketFlow } from "@/components/booking-ticket-flow";
import { StadiumCarousel } from "@/components/stadium-carousel";
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
    <main className="min-h-screen px-4 py-6 sm:py-10" style={{ background: "radial-gradient(circle at 10% 0%, rgba(59,99,244,0.14), transparent 32%), linear-gradient(180deg,#F4F6FB, #EEF2F8)", color: "#111418" }}>
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:items-start">
        <div className="grid gap-5">
          <StadiumCarousel compact />
          <section className="rounded-[1.6rem] border bg-white p-5 shadow-[var(--shadow-card)] sm:p-6" style={{ borderColor: "#E7EBF3" }}>
            <div className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: primary }}>Booking Link</div>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{eventName}</h1>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              {event ? `${event.venueName} · choose the right access type, verify Fayda, then receive your QR ticket.` : accessType}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Access</div>
                <div className="mt-2 text-lg font-black text-slate-950">{accessType}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Ticket mode</div>
                <div className="mt-2 text-lg font-black text-slate-950">{ticketTypes.length > 1 ? "Multiple types" : "Single link"}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Checkout</div>
                <div className="mt-2 text-lg font-black text-slate-950">
                  {ticketTypes.some((item) => item.paymentRequired && item.priceAmount > 0) ? "Paid / Free" : paymentRequired && priceAmount > 0 ? `${currency} ${priceAmount.toLocaleString()}` : "Free"}
                </div>
              </div>
            </div>
          </section>
        </div>
        <section className="rounded-[1.6rem] border p-5 shadow-[0_28px_52px_-30px_rgba(17,20,24,0.5)] sm:p-6" style={{ borderColor: "#E7EBF3", background: text, color: background }}>
          <div className="rounded-2xl p-4" style={{ background: primary, color: background }}>
            <div className="text-sm font-black">Secure booking access</div>
            <div className="mt-1 break-all text-xs font-bold opacity-80">Token: {token}</div>
            <div className="mt-3 inline-flex rounded-full bg-white/18 px-3 py-1 text-xs font-black">
              Fayda verification required
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
