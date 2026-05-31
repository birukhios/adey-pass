import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const setupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  password: z.string().min(8),
});

const seedPermissions = [
  ["dashboard:view", "dashboard", "view"],
  ["events:manage", "events", "manage"],
  ["guests:manage", "guests", "manage"],
  ["tickets:manage", "tickets", "manage"],
  ["verification:approve", "verification", "approve"],
  ["scanner:use", "scanner", "use"],
  ["scanner:override", "scanner", "override"],
  ["walkins:create", "walkins", "create"],
  ["reports:view", "reports", "view"],
  ["reports:export", "reports", "export"],
  ["settings:manage", "settings", "manage"],
  ["users:manage", "users", "manage"],
] as const;

export async function POST(request: Request) {
  const payload = setupSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: "Please provide valid setup details." }, { status: 422 });
  }

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return NextResponse.json({ message: "Setup is locked because an admin user already exists." }, { status: 409 });
  }

  const user = await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { systemKey: "super_admin" },
      update: { name: "Super Admin", description: "Full access to Adey Pass" },
      create: {
        systemKey: "super_admin",
        name: "Super Admin",
        description: "Full access to Adey Pass",
      },
    });

    for (const [key, resource, action] of seedPermissions) {
      const permission = await tx.permission.upsert({
        where: { key },
        update: {},
        create: {
          key,
          resource,
          action,
          label: key.replace(":", " "),
        },
      });
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }

    const createdUser = await tx.user.create({
      data: {
        name: payload.data.name,
        email: payload.data.email.toLowerCase(),
        phone: payload.data.phone,
        passwordHash: await bcrypt.hash(payload.data.password, 12),
        roles: {
          create: {
            roleId: role.id,
          },
        },
      },
      select: { id: true, email: true },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: createdUser.id,
        action: "setup.super_admin_created",
        entityType: "User",
        entityId: createdUser.id,
      },
    });

    return createdUser;
  });

  return NextResponse.json({ user });
}
