"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
      onClick={() => signOut({ callbackUrl: "/login" })}
      type="button"
      aria-label="Sign out"
    >
      Sign out
    </button>
  );
}
