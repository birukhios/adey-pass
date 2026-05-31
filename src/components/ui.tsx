import type { HTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "yellow" | "green" | "red" | "blue" | "neutral" | "dark" }) {
  const tones = {
    yellow: "bg-[#FFD100]/20 text-[#7A5C00] ring-[#FFD100]/40 dark:text-[#F8D85A]",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-800",
    red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/25 dark:text-red-300 dark:ring-red-800",
    blue: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/25 dark:text-sky-300 dark:ring-sky-800",
    neutral: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:ring-slate-700",
    dark: "bg-[#111418] text-white ring-[#111418]",
  };

  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1", tones[tone])}>{children}</span>;
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "dark" | "ghost" }) {
  const variants = {
    primary: "ap-button-primary",
    dark: "bg-[#111418] text-white hover:bg-black",
    ghost: "ap-button-ghost",
  };
  return (
    <Link className={cn("inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-black transition", variants[variant])} href={href}>
      {children}
    </Link>
  );
}

export function Card({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("ap-surface", className)} {...props}>{children}</section>;
}

export function Field({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
      {label}
      <input className="ap-input" placeholder={placeholder} type={type} />
    </label>
  );
}

export function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="grid gap-2 text-sm font-black" style={{ color: "var(--text-strong)" }}>
      {label}
      <select className="ap-input">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
