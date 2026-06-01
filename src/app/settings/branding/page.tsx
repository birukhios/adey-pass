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
  const value = (setting?.value as {
    appName?: string;
    organizationName?: string;
    primaryColor?: string;
    ticketFooterText?: string;
    appearance?: {
      theme?: string;
      cornerRadius?: string;
      density?: string;
      cardStyle?: string;
      sidebarStyle?: string;
      ticketShape?: string;
    };
  } | null) ?? {};

  return (
    <AppShell>
      <PageHeader title="Branding Settings" description="Stadium Management System visual identity, ticket footer text, logo placeholder, and primary color." />
      <SettingsTabs />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:gap-6">
        <Card>
          <BrandingSettingsForm
            initial={{
              appName: value.appName ?? "Stadium Management System",
              organizationName: value.organizationName ?? "Stadium Operations",
              primaryColor: value.primaryColor ?? "#0B7DE3",
              ticketFooterText: value.ticketFooterText ?? "Stadium Access & Gate Management",
              appearance: {
                theme: value.appearance?.theme ?? "System",
                cornerRadius: value.appearance?.cornerRadius ?? "Soft",
                density: value.appearance?.density ?? "Comfortable",
                cardStyle: value.appearance?.cardStyle ?? "Elevated",
                sidebarStyle: value.appearance?.sidebarStyle ?? "Navy",
                ticketShape: value.appearance?.ticketShape ?? "Rounded Pass",
              },
            }}
          />
        </Card>
        <Card className="bg-[#071B3D]"><AdeyLogo /><div className="mt-6 rounded-lg bg-[var(--adey-yellow)] p-5 text-white sm:p-6"><h2 className="text-xl font-black sm:text-2xl">Ticket Preview</h2><p className="mt-2 text-sm font-bold">Stadium Access & Gate Management</p></div></Card>
      </div>
    </AppShell>
  );
}
