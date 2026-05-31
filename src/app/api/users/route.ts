import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  roleSystemKey: z.string().min(2),
  permissionKeys: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.usersManage);
  if ("error" in auth) return auth.error;
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid user payload." }, { status: 422 });

  const role = await prisma.role.findUnique({ where: { systemKey: payload.data.roleSystemKey } });
  if (!role) return NextResponse.json({ message: "Role not found." }, { status: 404 });

  const user = await prisma.user.create({
    data: {
      name: payload.data.name,
      email: payload.data.email.toLowerCase(),
      phone: payload.data.phone || null,
      passwordHash: await bcrypt.hash("AdeyPass@2026", 12),
      roles: { create: { roleId: role.id } },
    },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });

  const effectivePermissions = Array.from(
    new Set(user.roles.flatMap((userRole) => userRole.role.permissions.map((rp) => rp.permission.key))),
  ).sort();

  if (payload.data.permissionKeys) {
    const allPermissions = await prisma.permission.findMany({ select: { id: true, key: true } });
    const selectedSet = new Set(payload.data.permissionKeys);
    const baseSet = new Set(effectivePermissions);
    const overrides: Array<{ userId: string; permissionId: string; granted: boolean }> = [];

    for (const permission of allPermissions) {
      const selected = selectedSet.has(permission.key);
      const inBase = baseSet.has(permission.key);
      if (selected && !inBase) overrides.push({ userId: user.id, permissionId: permission.id, granted: true });
      if (!selected && inBase) overrides.push({ userId: user.id, permissionId: permission.id, granted: false });
    }
    if (overrides.length) {
      await prisma.userPermissionOverride.createMany({ data: overrides });
    }
  }

  const refreshed = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      permissionOverrides: { include: { permission: true } },
    },
  });
  const finalPermissions = new Set(
    refreshed.roles.flatMap((userRole) => userRole.role.permissions.map((rp) => rp.permission.key)),
  );
  for (const override of refreshed.permissionOverrides) {
    if (override.granted) finalPermissions.add(override.permission.key);
    else finalPermissions.delete(override.permission.key);
  }

  return NextResponse.json({ ...refreshed, effectivePermissions: Array.from(finalPermissions).sort() }, { status: 201 });
}
