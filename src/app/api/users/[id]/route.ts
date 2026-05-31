import { UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
  roleSystemKey: z.string().optional(),
  permissionKeys: z.array(z.string()).optional(),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requirePermission(permissions.usersManage);
  if ("error" in auth) return auth.error;
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid user update." }, { status: 422 });
  const { id } = await params;

  if (payload.data.roleSystemKey) {
    const role = await prisma.role.findUnique({ where: { systemKey: payload.data.roleSystemKey } });
    if (!role) return NextResponse.json({ message: "Role not found." }, { status: 404 });

    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.userRole.create({ data: { userId: id, roleId: role.id } });
  }

  if (payload.data.permissionKeys) {
    const allPermissions = await prisma.permission.findMany({ select: { id: true, key: true } });
    const allKeys = new Set(allPermissions.map((permission) => permission.key));
    const validSelected = payload.data.permissionKeys.filter((key) => allKeys.has(key));

    const userWithRolePermissions = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    const rolePermissions = new Set(
      userWithRolePermissions.roles.flatMap((userRole) =>
        userRole.role.permissions.map((permission) => permission.permission.key),
      ),
    );

    await prisma.userPermissionOverride.deleteMany({ where: { userId: id } });

    const createPayload: Array<{ userId: string; permissionId: string; granted: boolean }> = [];
    for (const permission of allPermissions) {
      const selected = validSelected.includes(permission.key);
      const inRole = rolePermissions.has(permission.key);
      if (selected && !inRole) {
        createPayload.push({ userId: id, permissionId: permission.id, granted: true });
      }
      if (!selected && inRole) {
        createPayload.push({ userId: id, permissionId: permission.id, granted: false });
      }
    }
    if (createPayload.length) {
      await prisma.userPermissionOverride.createMany({ data: createPayload });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: payload.data.status ? { status: payload.data.status } : {},
    include: {
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      permissionOverrides: { include: { permission: true } },
    },
  });

  const basePermissions = new Set(
    updated.roles.flatMap((userRole) => userRole.role.permissions.map((rp) => rp.permission.key)),
  );
  for (const override of updated.permissionOverrides) {
    if (override.granted) basePermissions.add(override.permission.key);
    else basePermissions.delete(override.permission.key);
  }

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    roles: updated.roles,
    effectivePermissions: Array.from(basePermissions).sort(),
  });
}
