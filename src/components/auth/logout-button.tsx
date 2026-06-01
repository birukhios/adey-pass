"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition"
      style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-muted)" }}
      onClick={() => signOut({ callbackUrl: "/login" })}
      type="button"
      aria-label="Sign out"
    >
      Sign out
    </button>
  );
}
