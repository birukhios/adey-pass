import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SecuritySettingsForm } from "@/components/security-settings-form";
import { SettingsTabs } from "@/components/settings-tabs";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function SecuritySettingsPage() {
  await connection();
  const setting = await prisma.appSetting.findUnique({ where: { key: "security" } });
  const value = (setting?.value as {
    idVerificationRequiredByDefault?: boolean;
    walkInRegistrationAllowedByDefault?: boolean;
    ticketExpiryRule?: string;
    duplicateCheckinPrevention?: boolean;
  } | null) ?? {};

  return (
    <AppShell>
      <PageHeader title="Security Settings" description="Configure verification defaults, walk-in policy, token expiry, and duplicate check-in protection." />
      <SettingsTabs />
      <Card>
        <SecuritySettingsForm
          initial={{
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
