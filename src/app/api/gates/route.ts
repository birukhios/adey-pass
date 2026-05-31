import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.settingsManage);
  if ("error" in auth) return auth.error;

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid gate payload." }, { status: 422 });

  const gate = await prisma.gate.create({
    data: {
      name: payload.data.name,
      code: payload.data.code.toUpperCase(),
      description: payload.data.description || null,
      allowedCategories: [],
    },
  });
  return NextResponse.json(gate, { status: 201 });
}
