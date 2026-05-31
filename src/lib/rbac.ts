export const permissions = {
  dashboardView: "dashboard:view",
  eventsManage: "events:manage",
  guestsManage: "guests:manage",
  ticketsManage: "tickets:manage",
  verificationApprove: "verification:approve",
  scannerUse: "scanner:use",
  scannerOverride: "scanner:override",
  walkinsCreate: "walkins:create",
  reportsView: "reports:view",
  reportsExport: "reports:export",
  settingsManage: "settings:manage",
  usersManage: "users:manage",
} as const;

export type PermissionKey = (typeof permissions)[keyof typeof permissions];

export const routePermissions: Array<{ pattern: RegExp; permissions: PermissionKey[] }> = [
  { pattern: /^\/dashboard/, permissions: [permissions.dashboardView] },
  { pattern: /^\/events/, permissions: [permissions.eventsManage] },
  { pattern: /^\/guests/, permissions: [permissions.guestsManage] },
  { pattern: /^\/tickets/, permissions: [permissions.ticketsManage] },
  { pattern: /^\/scanner/, permissions: [permissions.scannerUse] },
  { pattern: /^\/reports/, permissions: [permissions.reportsView] },
  { pattern: /^\/settings\/users/, permissions: [permissions.usersManage] },
  { pattern: /^\/settings\/roles/, permissions: [permissions.usersManage] },
  { pattern: /^\/settings/, permissions: [permissions.settingsManage] },
];

const preferredRoutes: Array<{ path: string; permission: PermissionKey }> = [
  { path: "/dashboard", permission: permissions.dashboardView },
  { path: "/events", permission: permissions.eventsManage },
  { path: "/guests", permission: permissions.guestsManage },
  { path: "/tickets", permission: permissions.ticketsManage },
  { path: "/scanner", permission: permissions.scannerUse },
  { path: "/reports", permission: permissions.reportsView },
  { path: "/settings", permission: permissions.settingsManage },
];

export function hasAnyPermission(userPermissions: string[] = [], requiredPermissions: string[] = []) {
  if (!requiredPermissions.length) return true;
  return requiredPermissions.some((permission) => userPermissions.includes(permission));
}

export function permissionsForPath(pathname: string) {
  return routePermissions.find((route) => route.pattern.test(pathname))?.permissions ?? [];
}

export function firstAccessibleRoute(userPermissions: string[] = []) {
  const match = preferredRoutes.find((route) => userPermissions.includes(route.permission));
  return match?.path ?? "/login";
}
