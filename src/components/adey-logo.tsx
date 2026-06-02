import { cn } from "@/lib/utils";

export function AdeyLogo({ compact = false, className, theme = "dark" }: { compact?: boolean; className?: string; theme?: "dark" | "light" }) {
  const titleClass = theme === "dark" ? "text-white" : "text-[var(--text-strong)]";
  const subtitleClass = theme === "dark" ? "text-white/70" : "text-[var(--text-muted)]";

  return (
    <div className={cn("min-w-0", compact ? "text-center" : "", className)}>
      {compact ? (
        <div className={cn("text-sm font-black leading-tight tracking-tight", titleClass)}>SMS</div>
      ) : (
        <>
          <div className={cn("text-lg font-black leading-tight tracking-tight", titleClass)}>Stadium</div>
          <div className={cn("text-xs font-bold leading-tight", subtitleClass)}>Management System</div>
        </>
      )}
    </div>
  );
}
