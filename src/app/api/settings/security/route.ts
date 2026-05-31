import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  idVerificationRequiredByDefault: z.boolean(),
  walkInRegistrationAllowedByDefault: z.boolean(),
  ticketExpiryRule: z.string().min(2),
  duplicateCheckinPrevention: z.boolean(),
});

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.settingsManage);
  if ("error" in auth) return auth.error;
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid security settings." }, { status: 422 });

  const setting = await prisma.appSetting.upsert({
    where: { key: "security" },
    update: { value: payload.data, updatedById: auth.session.user.id },
    create: { key: "security", value: payload.data, updatedById: auth.session.user.id },
  });

  return NextResponse.json(setting);
}
