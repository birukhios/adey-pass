import { getServerSession } from "next-auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { firstAccessibleRoute } from "@/lib/rbac";

export default async function Home() {
  await connection();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  redirect(firstAccessibleRoute(session.user.permissions ?? []));
}
