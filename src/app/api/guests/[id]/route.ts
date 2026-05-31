import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(3),
  email: z.string().email().optional().or(z.literal("")),
  organization: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requirePermission(permissions.guestsManage);
  if ("error" in auth) return auth.error;
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid guest payload." }, { status: 422 });
  const { id } = await params;

  const guest = await prisma.guest.update({
    where: { id },
    data: {
      fullName: payload.data.fullName,
      phone: payload.data.phone,
      email: payload.data.email || null,
      organization: payload.data.organization || null,
      title: payload.data.title || null,
      notes: payload.data.notes || null,
    },
  });

  return NextResponse.json(guest);
}
