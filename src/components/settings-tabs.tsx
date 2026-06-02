"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/users", label: "Users & Roles" },
  { href: "/settings/gates", label: "Gates" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-2 rounded-2xl border p-2" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition",
                active ? "text-white" : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]",
              )}
              href={tab.href}
              key={tab.href}
              style={active ? { background: "var(--adey-yellow)" } : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
