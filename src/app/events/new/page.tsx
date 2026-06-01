import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { EventCreateForm } from "@/components/event-create-form";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getGatesList } from "@/lib/server-data";

export default async function NewEventPage() {
  await connection();
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
      <PageHeader title="Create Event" description="Create registration-only stadium events. Pick the stadium first, then configure gates, verification, and walk-ins." />
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
