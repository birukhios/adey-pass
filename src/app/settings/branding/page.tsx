import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { AdeyLogo } from "@/components/adey-logo";
import { BrandingSettingsForm } from "@/components/branding-settings-form";
import { PageHeader } from "@/components/page-header";
import { SettingsTabs } from "@/components/settings-tabs";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function BrandingSettingsPage() {
  await connection();
  const setting = await prisma.appSetting.findUnique({ where: { key: "branding" } });
  const value = (setting?.value as { appName?: string; organizationName?: string; primaryColor?: string; ticketFooterText?: string } | null) ?? {};

  return (
    <AppShell>
      <PageHeader title="Branding Settings" description="Adey Pass visual identity, ticket footer text, logo placeholder, and primary color." />
      <SettingsTabs />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:gap-6">
        <Card>
          <BrandingSettingsForm
            initial={{
              appName: value.appName ?? "Adey Pass",
              organizationName: value.organizationName ?? "Adey Pass",
              primaryColor: value.primaryColor ?? "#FFD100",
              ticketFooterText: value.ticketFooterText ?? "Smart Event Access & Registration",
            }}
          />
        </Card>
        <Card className="bg-[#111418]"><AdeyLogo /><div className="mt-6 rounded-lg bg-[#FFD100] p-5 text-[#111418] sm:p-6"><h2 className="text-xl font-black sm:text-2xl">Ticket Preview</h2><p className="mt-2 text-sm font-bold">Smart Event Access & Registration</p></div></Card>
      </div>
    </AppShell>
  );
}
