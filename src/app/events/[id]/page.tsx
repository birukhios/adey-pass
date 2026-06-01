import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { EventDetailSidePanel } from "@/components/event-detail-side-panel";
import { PageHeader } from "@/components/page-header";
import { Badge, Card } from "@/components/ui";
import { getEventSummary, getGatesList } from "@/lib/server-data";
import QRCodeLib from "qrcode";

type Props = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: Props) {
  await connection();
  const { id } = await params;
  const [event, gates] = await Promise.all([getEventSummary(id), getGatesList()]);
  if (!event) {
    return (
      <AppShell>
        <PageHeader title="Event not found" description="The requested event does not exist." />
      </AppShell>
    );
  }

  const firstTicket = event.guests.find((guest) => guest.ticket)?.ticket;
  const generatedLink = firstTicket ? `http://localhost:3000/ticket/${firstTicket.id}` : "Generate a guest ticket to create a public link";
  const organizationLink = `http://localhost:3000/organization/${event.id}`;
  const qrDataUrl = firstTicket ? await QRCodeLib.toDataURL(generatedLink, { width: 180, margin: 1 }) : "";
  const checkedIn = event.checkins.length;
  const registered = event.guests.length;
  const pending = event.idVerifications.length;
  const usedTickets = event.guests.filter((guest) => guest.ticket?.status === "USED").length;
  const generatedTickets = event.guests.filter((guest) => guest.ticket).length;
  const categories = Array.from(
    event.guests.reduce((map, guest) => map.set(guest.category.name, (map.get(guest.category.name) ?? 0) + 1), new Map<string, number>()),
  );

  return (
    <AppShell>
      <PageHeader
        title={event.name}
        description={`${event.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${event.startTime} - ${event.endTime} · ${event.venueName}`}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:gap-6">
        <div className="grid min-w-0 gap-4 xl:gap-6">
          <Card className="min-w-0">
            <div className="flex flex-wrap gap-2"><Badge tone="green">{event.status}</Badge><Badge>{event.eventType.replaceAll("_", " ")}</Badge><Badge tone="yellow">{event.idVerificationRequired ? "ID Required" : "ID Optional"}</Badge><Badge>{event.walkInRegistrationAllowed ? "Walk-ins Allowed" : "Walk-ins Disabled"}</Badge></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="ap-muted-surface p-4"><div className="text-2xl font-black">{registered}</div><div className="text-sm font-bold text-slate-500">Registered</div></div>
              <div className="ap-muted-surface p-4"><div className="text-2xl font-black">{checkedIn}</div><div className="text-sm font-bold text-slate-500">Checked in</div></div>
              <div className="ap-muted-surface p-4"><div className="text-2xl font-black">{pending}</div><div className="text-sm font-bold text-slate-500">Pending verification</div></div>
            </div>
          </Card>
          <Card className="min-w-0">
            <h2 className="text-base font-black sm:text-lg">Guest Activity Report</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <div className="mb-3 text-sm font-black text-slate-600 dark:text-slate-300">Attendance progress</div>
                {[
                  ["Registered", registered, registered],
                  ["Tickets Generated", generatedTickets, registered],
                  ["Checked In", checkedIn, registered],
                  ["Tickets Used", usedTickets, registered],
                ].map(([label, value, total]) => (
                  <div className="mb-4" key={label}>
                    <div className="mb-1 flex justify-between text-sm font-bold"><span>{label}</span><span>{value}</span></div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-[var(--adey-yellow)]" style={{ width: `${Math.min(100, total ? (Number(value) / Number(total)) * 100 : 0)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-3 text-sm font-black text-slate-600 dark:text-slate-300">Category breakdown</div>
                <div className="grid gap-3">
                  {categories.map(([name, value]) => (
                    <div className="flex items-center justify-between rounded-lg border p-3" key={name} style={{ borderColor: "var(--stroke)" }}>
                      <span className="font-bold">{name}</span>
                      <Badge tone="yellow">{value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
        <Card className="min-w-0">
          <EventDetailSidePanel
            event={{
              id: event.id,
              status: event.status,
              gateUsageEnabled: event.gateUsageEnabled,
              selectedGateIds: event.gates.map((gate) => gate.gate.id),
              idVerificationRequired: event.idVerificationRequired,
              walkInRegistrationAllowed: event.walkInRegistrationAllowed,
              maxAttendees: event.maxAttendees,
            }}
            gates={gates.map((gate) => ({ id: gate.id, name: gate.name }))}
            generatedLink={generatedLink}
            organizationLink={organizationLink}
            qrDataUrl={qrDataUrl}
          />
        </Card>
      </div>
    </AppShell>
  );
}
