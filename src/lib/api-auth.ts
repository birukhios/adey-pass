import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function requirePermission(permission: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  const permissions = session.user.permissions ?? [];
  if (!permissions.includes(permission)) {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
