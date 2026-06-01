"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleKey: string;
  status: "ACTIVE" | "INACTIVE";
  effectivePermissions: string[];
};
type RoleRow = { systemKey: string; name: string; permissions: string[] };

export function UsersSettingsManager({
  initialUsers,
  roles,
  permissionCatalog,
}: {
  initialUsers: UserRow[];
  roles: RoleRow[];
  permissionCatalog: string[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState({ name: "", email: "", phone: "", roleSystemKey: roles[0]?.systemKey ?? "" });
  const [createPermissions, setCreatePermissions] = useState<string[]>(roles[0]?.permissions ?? []);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [editingPermissionUserId, setEditingPermissionUserId] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const roleByKey = Object.fromEntries(roles.map((role) => [role.systemKey, role])) as Record<string, RoleRow>;

  async function createUser() {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, permissionKeys: createPermissions }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "Could not create user.");
      return;
    }
    setUsers((current) => [{
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.roles[0]?.role.name ?? "Unassigned",
      roleKey: result.roles[0]?.role.systemKey ?? "",
      status: result.status,
      effectivePermissions: result.effectivePermissions ?? [],
    }, ...current]);
    setMessage("User created.");
    setCreateModalOpen(false);
    setForm({ name: "", email: "", phone: "", roleSystemKey: roles[0]?.systemKey ?? "" });
    setCreatePermissions(roles[0]?.permissions ?? []);
  }

  async function saveUserAccess(
    user: UserRow,
    next: { status?: "ACTIVE" | "INACTIVE"; roleSystemKey?: string; permissionKeys?: string[] },
  ) {
    setSavingUserId(user.id);
    const response = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const result = await response.json();
    setSavingUserId(null);
    if (!response.ok) {
      setMessage(result.message ?? "Could not update user.");
      return;
    }
    setUsers((current) =>
      current.map((row) =>
        row.id === user.id
          ? {
              ...row,
              status: result.status,
              role: result.roles?.[0]?.role?.name ?? row.role,
              roleKey: result.roles?.[0]?.role?.systemKey ?? row.roleKey,
              effectivePermissions: result.effectivePermissions ?? row.effectivePermissions,
            }
          : row,
      ),
    );
    setMessage("User access updated.");
  }

  function openPermissionEditor(user: UserRow) {
    setEditingPermissionUserId(user.id);
    setDraftPermissions(user.effectivePermissions);
  }

  function toggleDraftPermission(permissionKey: string) {
    setDraftPermissions((current) =>
      current.includes(permissionKey)
        ? current.filter((key) => key !== permissionKey)
        : [...current, permissionKey],
    );
  }

  function toggleCreatePermission(permissionKey: string) {
    setCreatePermissions((current) =>
      current.includes(permissionKey)
        ? current.filter((key) => key !== permissionKey)
        : [...current, permissionKey],
    );
  }

  function selectAllCreatePermissions() {
    setCreatePermissions([...permissionCatalog]);
  }

  function clearCreatePermissions() {
    setCreatePermissions([]);
  }

  return (
    <section className="ap-surface">
      {createModalOpen ? <button className="fixed inset-0 z-40 bg-black/45" onClick={() => setCreateModalOpen(false)} type="button" /> : null}
      {createModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border p-4 shadow-[var(--shadow-soft)] sm:p-5" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">Create User</h2>
              <button className="ap-button-ghost" onClick={() => setCreateModalOpen(false)} type="button">Close</button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Name<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, name: event.target.value }))} value={form.name} /></label>
              <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Email<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, email: event.target.value }))} type="email" value={form.email} /></label>
              <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Phone<input className="ap-input" onChange={(event) => setForm((s) => ({ ...s, phone: event.target.value }))} value={form.phone} /></label>
              <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>Role<select className="ap-input" onChange={(event) => { const roleKey = event.target.value; setForm((s) => ({ ...s, roleSystemKey: roleKey })); setCreatePermissions(roleByKey[roleKey]?.permissions ?? []); }} value={form.roleSystemKey}>{roles.map((role) => <option key={role.systemKey} value={role.systemKey}>{role.name}</option>)}</select></label>
            </div>
            <div className="mt-4 rounded-2xl border p-3" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)" }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="ap-kicker">Permissions</div>
                <div className="flex flex-wrap gap-2">
                  <button className="ap-button-ghost h-8 px-3 text-xs" onClick={selectAllCreatePermissions} type="button">Select All</button>
                  <button className="ap-button-ghost h-8 px-3 text-xs" onClick={clearCreatePermissions} type="button">Unselect All</button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {permissionCatalog.map((permissionKey) => (
                  <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-strong)" }} key={`create-${permissionKey}`}>
                    <input checked={createPermissions.includes(permissionKey)} className="size-4 accent-[var(--adey-yellow)]" onChange={() => toggleCreatePermission(permissionKey)} type="checkbox" />
                    {permissionKey}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:flex">
              <button className="ap-button-primary" onClick={() => { void createUser(); }} type="button">Create User</button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black">Users & Access</h2>
        <button className="ap-button-primary w-full sm:w-auto" onClick={() => setCreateModalOpen(true)} type="button">Create User</button>
      </div>
      <div className="grid gap-6">
        <div>
        <div className="ap-mobile-list">
          {users.map((user) => (
            <article className="ap-mobile-card" key={user.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words font-black">{user.name}</div>
                  <div className="mt-1 break-all text-xs font-semibold ap-soft-text">{user.email}</div>
                </div>
                <Badge tone={user.status === "ACTIVE" ? "green" : "neutral"}>{user.status === "ACTIVE" ? "Active" : "Inactive"}</Badge>
              </div>
              <label className="mt-4 grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
                Role
                <select
                  className="ap-input"
                  onChange={(event) => {
                    void saveUserAccess(user, { roleSystemKey: event.target.value });
                  }}
                  value={user.roleKey}
                >
                  {roles.map((role) => (
                    <option key={role.systemKey} value={role.systemKey}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-3 flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                {user.effectivePermissions.slice(0, 8).map((permission) => (
                  <Badge key={`${user.id}-mobile-${permission}`} tone="neutral">{permission}</Badge>
                ))}
                {user.effectivePermissions.length > 8 ? <Badge tone="neutral">+{user.effectivePermissions.length - 8} more</Badge> : null}
              </div>
              <div className="mt-4 grid gap-2">
                <button className="ap-button-ghost" onClick={() => openPermissionEditor(user)} type="button">Edit Permissions</button>
                <button
                  className="ap-button-ghost disabled:opacity-60"
                  disabled={savingUserId === user.id}
                  onClick={() => {
                    void saveUserAccess(user, { status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
                  }}
                  type="button"
                >
                  {savingUserId === user.id ? "Saving..." : user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="ap-desktop-table overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
              <tr><th className="py-3">User</th><th>Email</th><th>Role</th><th>Status</th><th>Permissions</th><th>Actions</th></tr>
            </thead>
            <tbody style={{ borderColor: "var(--stroke)" }}>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 font-black">{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="ap-input h-9 py-0 text-xs"
                      onChange={(event) => {
                        void saveUserAccess(user, { roleSystemKey: event.target.value });
                      }}
                      value={user.roleKey}
                    >
                      {roles.map((role) => (
                        <option key={role.systemKey} value={role.systemKey}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td><Badge tone={user.status === "ACTIVE" ? "green" : "neutral"}>{user.status === "ACTIVE" ? "Active" : "Inactive"}</Badge></td>
                  <td>
                    <div className="flex max-w-[280px] flex-wrap gap-1">
                      {user.effectivePermissions.map((permission) => (
                        <Badge key={`${user.id}-${permission}`} tone="neutral">{permission}</Badge>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="ap-button-ghost"
                        onClick={() => openPermissionEditor(user)}
                        type="button"
                      >
                        Edit Permissions
                      </button>
                      <button
                        className="ap-button-ghost disabled:opacity-60"
                        disabled={savingUserId === user.id}
                        onClick={() => {
                          void saveUserAccess(user, { status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
                        }}
                        type="button"
                      >
                        {savingUserId === user.id ? "Saving..." : user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editingPermissionUserId ? (
          <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-black">Edit User Permissions</div>
              <div className="flex flex-wrap gap-2">
                <button className="ap-button-ghost h-8 px-3 text-xs" onClick={() => setDraftPermissions([...permissionCatalog])} type="button">Select All</button>
                <button className="ap-button-ghost h-8 px-3 text-xs" onClick={() => setDraftPermissions([])} type="button">Unselect All</button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {permissionCatalog.map((permissionKey) => (
                <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-strong)" }} key={permissionKey}>
                  <input
                    checked={draftPermissions.includes(permissionKey)}
                    className="size-4 accent-[var(--adey-yellow)]"
                    onChange={() => toggleDraftPermission(permissionKey)}
                    type="checkbox"
                  />
                  {permissionKey}
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:flex">
              <button
                className="ap-button-primary"
                onClick={() => {
                  const user = users.find((item) => item.id === editingPermissionUserId);
                  if (!user) return;
                  void saveUserAccess(user, { permissionKeys: draftPermissions });
                  setEditingPermissionUserId(null);
                }}
                type="button"
              >
                Save Permissions
              </button>
              <button className="ap-button-ghost" onClick={() => setEditingPermissionUserId(null)} type="button">
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        </div>
      </div>
      {message ? <div className="mt-4 rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-strong)" }}>{message}</div> : null}
    </section>
  );
}
