"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const email = String(formData.get("email") ?? "").trim().toLowerCase();
      const password = String(formData.get("password") ?? "");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email, password, or inactive account.");
        return;
      }

      if (!result?.url) {
        setError("Sign in did not return a redirect URL. Please refresh and try again.");
        return;
      }

      router.push(result?.url ?? callbackUrl);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-5">
      <label className="ap-field-label">
        Email
        <input
          className="ap-input h-12"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="super@adeypass.local"
          required
        />
      </label>
      <label className="ap-field-label">
        Password
        <input
          className="ap-input h-12"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
          required
        />
      </label>
      <div className="flex items-center justify-between">
        <div className="ap-kicker">Secure login</div>
        <Link className="text-sm font-bold" href="/forgot-password" style={{ color: "color-mix(in oklab, var(--adey-yellow) 65%, var(--adey-charcoal))" }}>Forgot password?</Link>
      </div>
      {error && <div className="ap-form-message" style={{ borderColor: "color-mix(in oklab, var(--danger) 30%, transparent)", background: "color-mix(in oklab, var(--danger) 10%, var(--surface))", color: "var(--danger)" }}>{error}</div>}
      <button
        className="ap-button-primary mt-1 inline-flex h-12 items-center justify-center px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
