import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { EventStatusActions } from "@/components/event-status-actions";
import { PageHeader } from "@/components/page-header";
import { Badge, ButtonLink, Card, SelectField } from "@/components/ui";
import { getEventsList } from "@/lib/server-data";

export default async function EventsPage() {
  await connection();
  const events = await getEventsList();
  return (
    <AppShell>
      <PageHeader title="Events" description="Create and manage registration-only events. Gates are optional; seats are intentionally out of scope for this MVP." actionHref="/events/new" actionLabel="Create Event" />
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <SelectField label="Status" options={["All statuses", "Draft", "Active", "Closed", "Archived"]} />
        <SelectField label="Gate usage" options={["All events", "Gates enabled", "No gates"]} />
        <SelectField label="Verification" options={["All", "ID required", "ID not required"]} />
      </div>
      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black">{event.name}</h2>
                  <Badge tone={event.status === "Active" ? "green" : "yellow"}>{event.status}</Badge>
                  <Badge>Registration-Only</Badge>
                </div>
                <p className="mt-2 text-sm font-semibold ap-soft-text">{event.date} · {event.time} · {event.venue}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.gates.length ? event.gates.map((gate) => <Badge key={gate} tone="dark">{gate}</Badge>) : <Badge>No gates assigned</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm lg:w-72">
                <div className="rounded-2xl p-3" style={{ background: "var(--surface-muted)" }}><div className="font-black">{event.registered}</div><div className="ap-soft-text">Registered</div></div>
                <div className="rounded-2xl p-3" style={{ background: "var(--surface-muted)" }}><div className="font-black">{event.checkedIn}</div><div className="ap-soft-text">Checked in</div></div>
              </div>
              <div className="flex flex-col gap-2">
                <ButtonLink href={`/events/${event.id}`} variant="ghost">View Details</ButtonLink>
                <EventStatusActions currentStatus={event.status} eventId={event.id} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
