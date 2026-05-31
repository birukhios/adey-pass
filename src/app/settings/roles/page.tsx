import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsTabs } from "@/components/settings-tabs";
import { Badge, Card } from "@/components/ui";
import { getRolesWithPermissions } from "@/lib/server-data";

export default async function RolesSettingsPage() {
  const roles = await getRolesWithPermissions();

  return (
    <AppShell>
      <PageHeader title="Roles And Permissions" description="Data-driven role permissions keep the app ready for organization-specific access rules." />
      <SettingsTabs />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-3">Role</th><th>Description</th><th>Users</th><th>Permissions</th></tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F7]">
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="py-3 font-black">{role.name}</td>
                  <td>{role.description}</td>
                  <td>{role.userCount}</td>
                  <td><Badge tone={role.systemKey === "super_admin" ? "yellow" : "neutral"}>{role.permissionCount} keys</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
