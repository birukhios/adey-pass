"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SetupForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          password: formData.get("password"),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message ?? "Unable to create first admin.");
        return;
      }

      router.push("/login");
    });
  }

  return (
    <form action={handleSubmit} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Name
        <input className="ap-input" name="name" placeholder="Super Admin" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Email
        <input className="ap-input" name="email" placeholder="super@adeypass.local" type="email" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Phone
        <input className="ap-input" name="phone" placeholder="+251" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Password
        <input className="ap-input" name="password" type="password" />
      </label>
      {message && <div className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{message}</div>}
      <button className="ap-button-primary h-12 text-sm font-black" disabled={isPending} type="submit">
        {isPending ? "Creating..." : "Create Super Admin"}
      </button>
    </form>
  );
}
