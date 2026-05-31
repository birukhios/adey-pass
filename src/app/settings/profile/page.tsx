import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { SettingsTabs } from "@/components/settings-tabs";
import { Card } from "@/components/ui";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <AppShell>
      <PageHeader title="Profile Settings" description="Update admin identity, contact details, profile photo placeholder, and password." />
      <SettingsTabs />
      <Card>
        <ProfileSettingsForm initial={{ name: user.name, email: user.email, phone: user.phone ?? "" }} />
      </Card>
    </AppShell>
  );
}
