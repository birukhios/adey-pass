import Link from "next/link";
import { connection } from "next/server";
import QRCode from "react-qr-code";
import { prisma } from "@/lib/prisma";
import { AdeyLogo } from "@/components/adey-logo";
import { TicketReceiptDownload } from "@/components/ticket-receipt-download";
import { Badge } from "@/components/ui";

type Props = { params: Promise<{ token: string }> };

export default async function PublicTicketPage({ params }: Props) {
  await connection();
  const { token } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { OR: [{ id: token }, { ticketId: token }] },
    include: { guest: { include: { category: true, idVerification: true } }, event: true, gate: true },
  });

  if (!ticket) {
    return (
      <main className="min-h-screen bg-[#F4F6FB] px-4 py-6 text-[var(--adey-charcoal)]">
        <div className="mx-auto max-w-md rounded-xl border border-[#E7EBF3] bg-white p-6">
          Ticket not found.
        </div>
      </main>
    );
  }

  const verificationPending = ticket.event.idVerificationRequired && !["VERIFIED", "MANUALLY_APPROVED"].includes(ticket.guest.idVerification?.status ?? "NOT_STARTED");
  const isWalkIn = ticket.guest.source === "WALK_IN";

  return (
    <main className="min-h-screen bg-[#F4F6FB] px-4 py-6 text-[var(--adey-charcoal)]">
      <div className="mx-auto max-w-md">
        <div className="rounded-lg bg-[#111418] p-5"><AdeyLogo /></div>
        <section className="mt-6 overflow-hidden rounded-2xl border border-[#E7EBF3] bg-white text-[var(--adey-charcoal)] shadow-[0_24px_48px_-24px_rgba(17,20,24,0.35)]">
          <div className="bg-[var(--adey-yellow)] p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em]">{ticket.event.name}</p>
            <h1 className="mt-2 text-3xl font-black">{ticket.guest.fullName}</h1>
            <p className="mt-1 text-sm font-bold">{ticket.accessType} · {ticket.guest.organization ?? "Guest"}</p>
          </div>
          <div className="p-6">
            <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 p-5">
              <QRCode value={JSON.stringify({ ticketId: ticket.ticketId, ticketDbId: ticket.id, url: `/ticket/${ticket.id}` })} size={220} />
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between"><span className="font-bold text-slate-500">Ticket ID</span><span className="font-black">{ticket.ticketId}</span></div>
              <div className="flex items-center justify-between"><span className="font-bold text-slate-500">Status</span><Badge tone={verificationPending ? "yellow" : "green"}>{verificationPending ? "Verification Required" : "Valid For Entry"}</Badge></div>
              <div className="flex items-center justify-between"><span className="font-bold text-slate-500">Gate</span><span className="font-black">{ticket.gate?.name ?? "Any Gate"}</span></div>
            </div>
            {verificationPending ? (
              <>
                <p className="mt-5 rounded-lg bg-[var(--adey-yellow)]/20 p-4 text-sm font-bold leading-6 text-[var(--adey-yellow-deep)]">Please verify your National/Fayda ID before arrival.</p>
                <Link className="mt-4 flex h-12 items-center justify-center rounded-lg bg-[#111418] text-sm font-black text-white" href={`/verify/${ticket.id}`}>Verify National/Fayda ID</Link>
              </>
            ) : (
              <>
                <p className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-700">Show this QR code at the gate.</p>
                <TicketReceiptDownload
                  accessType={ticket.accessType}
                  buttonLabel={isWalkIn ? "Download Walk-in Receipt" : "Download Ticket"}
                  eventName={ticket.event.name}
                  guestName={ticket.guest.fullName}
                  organization={ticket.guest.organization}
                  phone={ticket.guest.phone}
                  source={ticket.guest.source}
                  status={ticket.status}
                  subtitle={isWalkIn ? "Walk-in access receipt" : "Verified access ticket"}
                  ticketId={ticket.ticketId}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
