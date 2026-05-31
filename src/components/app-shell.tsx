"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Menu, Moon, Sun, X } from "lucide-react";
import { AdeyLogo } from "@/components/adey-logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { navItems } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const allowedPermissions = session?.user?.permissions ?? [];
  const allowedNavItems = navItems.filter((item) => allowedPermissions.includes(item.permission));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavCollapsed, setDesktopNavCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("adey-theme") === "dark";
  });
  const displayName = session?.user?.name ?? "Adey Admin";
  const displayEmail = session?.user?.email ?? "admin@adeypass.local";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const currentNavLabel =
    allowedNavItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? "Adey Pass";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem("adey-theme", isDark ? "dark" : "light");
  }, [isDark]);

  function toggleTheme() {
    setIsDark((value) => !value);
  }

  const shellNav = (compact = false, closeMobile = false) => (
    <>
      <nav className="mt-8 grid gap-1.5">
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font800 font-semibold transition",
                compact && "justify-center",
                active
                  ? "bg-[var(--adey-yellow)] text-[var(--adey-charcoal)] shadow-[0_14px_30px_-22px_var(--adey-yellow)]"
                  : "text-white/65 hover:bg-white/8 hover:text-white",
              )}
              href={item.href}
              key={item.href}
              onClick={closeMobile ? () => setMobileNavOpen(false) : undefined}
              title={compact ? item.label : undefined}
            >
              <Icon size={18} />
              {!compact ? item.label : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-white shadow-[0_18px_40px_-30px_rgba(0,0,0,0.9)]">
        <div className={cn("flex items-center gap-3", compact && "justify-center")}>
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--adey-yellow)] text-xs font-black text-[var(--adey-charcoal)]">{initials}</div>
          {!compact ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-black">{displayName}</div>
              <div className="truncate text-xs font-semibold text-white/45">{displayEmail}</div>
            </div>
          ) : null}
        </div>
        {!compact ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white" onClick={toggleTheme} type="button">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              <span className="ml-2">{isDark ? "Light" : "Dark"}</span>
            </button>
            <LogoutButton />
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      {mobileNavOpen ? <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)} type="button" /> : null}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[linear-gradient(180deg,var(--sidebar-start),var(--sidebar-end))] p-5 text-white transition-transform duration-200 lg:hidden", mobileNavOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-2 flex items-center justify-between">
          <AdeyLogo theme="dark" />
          <button aria-label="Close navigation" className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white" onClick={() => setMobileNavOpen(false)} type="button">
            <X size={18} />
          </button>
        </div>
        {shellNav(false, true)}
      </aside>
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/10 bg-[linear-gradient(180deg,var(--sidebar-start),var(--sidebar-end))] p-5 text-white transition-[width] lg:flex", desktopNavCollapsed ? "w-24" : "w-72")}>
        <div className="flex items-center justify-between gap-2">
          <AdeyLogo compact={desktopNavCollapsed} theme="dark" />
          <button aria-label={desktopNavCollapsed ? "Expand navigation" : "Minimize navigation"} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white" onClick={() => setDesktopNavCollapsed((value) => !value)} type="button">
            {desktopNavCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
        {shellNav(desktopNavCollapsed)}
      </aside>

      <div className={cn("transition-[padding] lg:pl-72", desktopNavCollapsed && "lg:pl-24")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-xl md:px-8" style={{ borderColor: "var(--stroke)", background: "color-mix(in oklab, var(--app-bg) 86%, transparent)" }}>
          <button className="grid size-10 place-items-center rounded-xl border lg:hidden" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }} aria-label="Open navigation" onClick={() => setMobileNavOpen(true)} type="button">
            <Menu size={20} />
          </button>
          <div className="text-sm font-black" style={{ color: "var(--text-strong)" }}>{currentNavLabel}</div>
        </header>
        <main className="page-enter min-h-[calc(100vh-64px)] px-4 py-6 md:px-8">
          <div className="ap-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
