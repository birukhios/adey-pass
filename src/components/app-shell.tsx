"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Menu, Moon, Sun, X } from "lucide-react";
import { AdeyLogo } from "@/components/adey-logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { StadiumSelector } from "@/components/stadium-selector";
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
  const displayName = session?.user?.name ?? "Stadium Admin";
  const displayEmail = session?.user?.email ?? "admin@adeypass.local";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const currentNavLabel =
    allowedNavItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? "Stadium Management System";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem("adey-theme", isDark ? "dark" : "light");
  }, [isDark]);

  function toggleTheme() {
    setIsDark((value) => !value);
  }

  const navGroups = [
    { label: "Operations", items: allowedNavItems.filter((item) => ["Dashboard", "Events", "Guests", "Tickets", "Scanner", "Reports"].includes(item.label)) },
    { label: "Configuration", items: allowedNavItems.filter((item) => ["Settings"].includes(item.label)) },
  ].filter((group) => group.items.length > 0);

  const shellNav = (compact = false, closeMobile = false) => (
    <>
      <nav className="mt-8 grid gap-6">
        {navGroups.map((group) => (
          <div className="grid gap-1.5" key={group.label}>
            {!compact ? <div className="px-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--text-soft)]">{group.label}</div> : null}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition",
                    compact && "justify-center",
                    active
                      ? "bg-[var(--adey-yellow)] text-white shadow-[0_14px_30px_-22px_rgba(59,99,244,0.85)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]",
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
          </div>
        ))}
      </nav>
      <div className="mt-auto rounded-[1.5rem] border p-3 shadow-[var(--shadow-card)]" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>
        <div className={cn("flex items-center gap-3", compact && "justify-center")}>
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--adey-yellow)] text-xs font-black text-white">{initials}</div>
          {!compact ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-[var(--text-strong)]">{displayName}</div>
              <div className="truncate text-xs font-semibold text-[var(--text-muted)]">{displayEmail}</div>
            </div>
          ) : null}
        </div>
        {!compact ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition" onClick={toggleTheme} style={{ borderColor: "var(--stroke)", background: "var(--surface-muted)", color: "var(--text-muted)" }} type="button">
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
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col border-r p-4 transition-transform duration-200 sm:p-5 lg:hidden", mobileNavOpen ? "translate-x-0" : "-translate-x-full")} style={{ borderColor: "var(--stroke)", background: "linear-gradient(180deg,var(--sidebar-start),var(--sidebar-end))" }}>
        <div className="mb-2 flex items-center justify-between">
          <AdeyLogo theme="light" />
          <button aria-label="Close navigation" className="grid size-10 place-items-center rounded-xl border" onClick={() => setMobileNavOpen(false)} style={{ borderColor: "var(--stroke)", background: "var(--surface)" }} type="button">
            <X size={18} />
          </button>
        </div>
        {shellNav(false, true)}
      </aside>
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col border-r p-5 transition-[width] lg:flex", desktopNavCollapsed ? "w-24" : "w-72")} style={{ borderColor: "var(--stroke)", background: "linear-gradient(180deg,var(--sidebar-start),var(--sidebar-end))" }}>
        <div className="flex items-center justify-between gap-2">
          <AdeyLogo compact={desktopNavCollapsed} theme="light" />
          <button aria-label={desktopNavCollapsed ? "Expand navigation" : "Minimize navigation"} className="grid size-10 place-items-center rounded-xl border transition" onClick={() => setDesktopNavCollapsed((value) => !value)} style={{ borderColor: "var(--stroke)", background: "var(--surface)", color: "var(--text-muted)" }} type="button">
            {desktopNavCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
        {shellNav(desktopNavCollapsed)}
      </aside>

      <div className={cn("transition-[padding] lg:pl-72", desktopNavCollapsed && "lg:pl-24")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-3 backdrop-blur-xl sm:px-4 md:px-8" style={{ borderColor: "var(--stroke)", background: "color-mix(in oklab, var(--surface) 88%, transparent)" }}>
          <button className="grid size-10 place-items-center rounded-xl border lg:hidden" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }} aria-label="Open navigation" onClick={() => setMobileNavOpen(true)} type="button">
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1 text-sm font-semibold" style={{ color: "var(--text-strong)" }}>{currentNavLabel}</div>
          <div className="hidden h-11 w-full max-w-md items-center rounded-2xl border px-4 text-sm font-semibold text-[var(--text-soft)] md:flex" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>Search anything...</div>
          <StadiumSelector compact />
        </header>
        <main className="page-enter min-h-[calc(100vh-56px)] px-3 py-4 sm:px-4 sm:py-6 md:px-8 lg:min-h-[calc(100vh-64px)]">
          <div className="ap-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
