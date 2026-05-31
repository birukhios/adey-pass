import { AppShell } from "@/components/app-shell";
import { EventCreateForm } from "@/components/event-create-form";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getGatesList } from "@/lib/server-data";

export default async function NewEventPage() {
  const [gates, setting] = await Promise.all([
    getGatesList(),
    prisma.appSetting.findUnique({ where: { key: "security" } }),
  ]);
  const value = (setting?.value as {
    idVerificationRequiredByDefault?: boolean;
    walkInRegistrationAllowedByDefault?: boolean;
    ticketExpiryRule?: string;
    duplicateCheckinPrevention?: boolean;
  } | null) ?? {};

  return (
    <AppShell>
      <PageHeader title="Create Event" description="The working mode for this version is Registration-Only. Seated and hybrid event architecture can be added later without forcing seats into this flow." />
      <Card>
        <EventCreateForm
          gates={gates.map((gate) => ({ id: gate.id, name: gate.name }))}
          securityDefaults={{
            idVerificationRequiredByDefault: value.idVerificationRequiredByDefault ?? true,
            walkInRegistrationAllowedByDefault: value.walkInRegistrationAllowedByDefault ?? true,
            ticketExpiryRule: value.ticketExpiryRule ?? "At event close",
            duplicateCheckinPrevention: value.duplicateCheckinPrevention ?? true,
          }}
        />
      </Card>
    </AppShell>
  );
}
