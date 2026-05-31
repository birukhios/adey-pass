import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { GuestBulkUpload } from "@/components/guest-bulk-upload";
import { PageHeader } from "@/components/page-header";
import { getEventOptions, getGuestCategoryOptions, getGuestsList } from "@/lib/server-data";

export default async function GuestsPage() {
  await connection();
  const [guests, events, categories] = await Promise.all([
    getGuestsList(),
    getEventOptions(),
    getGuestCategoryOptions(),
  ]);
  return (
    <AppShell>
      <PageHeader title="Guests" description="Manage invited VIP, media, staff, sponsor, protocol, security, vendor, emergency, and special guests. Public users belong in registration or walk-in flows." />
      <GuestBulkUpload
        categories={categories}
        events={events}
        initialGuests={guests}
      />
    </AppShell>
  );
}
