import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            permissionOverrides: {
              include: {
                permission: true,
              },
            },
          },
        });

        if (!user || user.status !== "ACTIVE") return null;

        const passwordIsValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordIsValid) return null;

        const roles = user.roles.map((userRole) => userRole.role.systemKey);
        const basePermissions = Array.from(
          new Set(user.roles.flatMap((userRole) => userRole.role.permissions.map((rolePermission) => rolePermission.permission.key))),
        );
        const allowSet = new Set(
          user.permissionOverrides.filter((override) => override.granted).map((override) => override.permission.key),
        );
        const denySet = new Set(
          user.permissionOverrides.filter((override) => !override.granted).map((override) => override.permission.key),
        );
        const permissions = Array.from(new Set([...basePermissions, ...allowSet])).filter((key) => !denySet.has(key));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.roles = user.roles;
        token.permissions = user.permissions;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.roles = token.roles ?? [];
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },
};
