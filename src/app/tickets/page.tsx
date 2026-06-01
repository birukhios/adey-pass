import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { EventTicketBoard } from "@/components/event-ticket-board";
import { PageHeader } from "@/components/page-header";
import { getTicketTypeBoard } from "@/lib/server-data";

export default async function TicketsPage() {
  await connection();
  const events = await getTicketTypeBoard();
  return (
    <AppShell>
      <PageHeader title="Tickets" description="Select an event, manage ticket groups, edit quantities, choose design outlines, and copy booking links." />
      <EventTicketBoard initialEvents={events} />
    </AppShell>
  );
}
