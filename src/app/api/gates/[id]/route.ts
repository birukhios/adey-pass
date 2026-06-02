import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  active: z.boolean(),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requirePermission(permissions.settingsManage);
  if ("error" in auth) return auth.error;

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid gate payload." }, { status: 422 });

  const { id } = await params;
  try {
    const gate = await prisma.gate.update({
      where: { id },
      data: {
        name: payload.data.name,
        code: payload.data.code.toUpperCase(),
        description: payload.data.description || null,
        active: payload.data.active,
      },
    });
    return NextResponse.json(gate);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "Gate code already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Could not update gate." }, { status: 422 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const auth = await requirePermission(permissions.settingsManage);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    await prisma.gate.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    const gate = await prisma.gate.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ deleted: false, archived: true, gate });
  }
}
