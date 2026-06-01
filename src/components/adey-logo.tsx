import { cn } from "@/lib/utils";

export function AdeyLogo({ compact = false, className, theme = "dark" }: { compact?: boolean; className?: string; theme?: "dark" | "light" }) {
  const titleClass = theme === "dark" ? "text-white" : "text-[var(--text-strong)]";
  const subtitleClass = theme === "dark" ? "text-white/60" : "text-[var(--text-muted)]";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--adey-yellow)] shadow-[0_0_0_6px_color-mix(in_oklab,var(--adey-yellow)_12%,transparent)]">
        <div className="absolute inset-2 rounded-full border-[5px] border-white/90" />
        <div className="absolute inset-x-2 top-4 h-2 rounded-full border-t-4 border-white/70" />
        <div className="absolute bottom-2 z-10 h-6 w-5 rounded-[4px] bg-white shadow-sm">
          <div className="absolute inset-1 rounded-[3px] border border-[var(--adey-yellow)]" />
          <div className="absolute left-1.5 top-2 size-1 bg-[var(--adey-charcoal)]" />
          <div className="absolute right-1.5 top-2 size-1 bg-[var(--adey-charcoal)]" />
          <div className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 bg-[var(--adey-charcoal)]" />
        </div>
      </div>
      {!compact && (
        <div>
          <div className={cn("text-xl font-black tracking-tight", titleClass)}>
            Afro<span className="text-[var(--adey-yellow)]">pay</span>
          </div>
          <div className={cn("text-xs font-medium", subtitleClass)}>Stadium Management</div>
        </div>
      )}
    </div>
  );
}
