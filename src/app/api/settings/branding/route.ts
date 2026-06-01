import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/rbac";

const payloadSchema = z.object({
  appName: z.string().min(2),
  organizationName: z.string().min(2),
  primaryColor: z.string().min(4),
  ticketFooterText: z.string().min(2),
  appearance: z.object({
    theme: z.string().min(2),
    cornerRadius: z.string().min(2),
    density: z.string().min(2),
    cardStyle: z.string().min(2),
    sidebarStyle: z.string().min(2),
    ticketShape: z.string().min(2),
  }).optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission(permissions.settingsManage);
  if ("error" in auth) return auth.error;
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ message: "Invalid branding settings." }, { status: 422 });

  const setting = await prisma.appSetting.upsert({
    where: { key: "branding" },
    update: {
      value: payload.data,
      updatedById: auth.session.user.id,
    },
    create: {
      key: "branding",
      value: payload.data,
      updatedById: auth.session.user.id,
    },
  });

  return NextResponse.json(setting);
}
