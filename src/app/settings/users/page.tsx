import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsTabs } from "@/components/settings-tabs";
import { UsersSettingsManager } from "@/components/users-settings-manager";
import { getPermissionCatalog, getRolesWithPermissions, getUsersWithRoles } from "@/lib/server-data";

export default async function UsersSettingsPage() {
  await connection();
  const [users, roles, permissionCatalog] = await Promise.all([
    getUsersWithRoles(),
    getRolesWithPermissions(),
    getPermissionCatalog(),
  ]);

  return (
    <AppShell>
      <PageHeader title="User Management" description="Create users, assign roles, activate or deactivate accounts, and prepare password reset workflow." />
      <SettingsTabs />
      <UsersSettingsManager
        initialUsers={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          roleKey: user.roleKey,
          status: user.status,
          effectivePermissions: user.effectivePermissions,
        }))}
        roles={roles.map((role) => ({ systemKey: role.systemKey, name: role.name, permissions: role.permissions }))}
        permissionCatalog={permissionCatalog.map((permission) => permission.key)}
      />
    </AppShell>
  );
}
