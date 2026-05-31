import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ButtonLink, Card, Field } from "@/components/ui";

export default function ChangePasswordPage() {
  return (
    <AppShell>
      <PageHeader title="Change Password" description="Password change form placeholder for Phase 2 account settings." />
      <Card className="max-w-xl">
        <div className="grid gap-4">
          <Field label="Current password" type="password" />
          <Field label="New password" type="password" />
          <Field label="Confirm new password" type="password" />
        </div>
        <div className="mt-6">
          <ButtonLink href="/settings/profile">Update Password</ButtonLink>
        </div>
      </Card>
    </AppShell>
  );
}
