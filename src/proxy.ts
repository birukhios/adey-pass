import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { firstAccessibleRoute, hasAnyPermission, permissionsForPath } from "@/lib/rbac";
import { env } from "@/lib/env";

const publicRoutes = ["/login", "/setup", "/forgot-password"];
const publicPrefixes = ["/api/auth", "/ticket", "/verify", "/rsvp", "/organization", "/api/rsvp", "/api/organization"];

function isPublicPath(pathname: string) {
  return publicRoutes.includes(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredPermissions = permissionsForPath(pathname);
  const userPermissions = token.permissions ?? [];

  if (!hasAnyPermission(userPermissions, requiredPermissions)) {
    const fallback = firstAccessibleRoute(userPermissions);
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
