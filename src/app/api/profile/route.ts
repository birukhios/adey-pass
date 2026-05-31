import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  newPassword: z.string().optional(),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid profile payload." }, { status: 422 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: payload.data.name,
      email: payload.data.email.toLowerCase(),
      phone: payload.data.phone || null,
      ...(payload.data.newPassword ? { passwordHash: await bcrypt.hash(payload.data.newPassword, 12) } : {}),
    },
    select: { id: true, name: true, email: true, phone: true },
  });

  return NextResponse.json(updated);
}
