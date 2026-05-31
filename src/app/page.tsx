import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { firstAccessibleRoute } from "@/lib/rbac";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  redirect(firstAccessibleRoute(session.user.permissions ?? []));
}
