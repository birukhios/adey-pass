import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TicketBookingLinkBuilder } from "@/components/ticket-booking-link-builder";

export default async function TicketsPage() {
  return (
    <AppShell>
      <PageHeader title="Ticket Builder" description="Build branded booking links and ticket page designs. Ticket booking lists now live with Guests." />
      <TicketBookingLinkBuilder />
    </AppShell>
  );
}
