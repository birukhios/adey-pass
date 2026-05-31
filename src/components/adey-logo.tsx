import { cn } from "@/lib/utils";

export function AdeyLogo({ compact = false, className, theme = "dark" }: { compact?: boolean; className?: string; theme?: "dark" | "light" }) {
  const titleClass = theme === "dark" ? "text-white" : "text-[#111418]";
  const subtitleClass = theme === "dark" ? "text-white/60" : "text-slate-600";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid size-12 shrink-0 place-items-center rounded-full bg-[#FFD100] shadow-[0_0_0_6px_rgba(255,209,0,0.16)]">
        <div className="absolute inset-1 rounded-full border-[6px] border-[#111418]" />
        <div className="absolute inset-3 rounded-full border-2 border-[#FFD100] bg-[#111418]" />
        <div className="z-10 h-4 w-5 rounded-[3px] border border-[#FFD100]" />
      </div>
      {!compact && (
        <div>
          <div className={cn("text-xl font-black tracking-tight", titleClass)}>
            Adey <span className="text-[#FFD100]">Pass</span>
          </div>
          <div className={cn("text-xs font-medium", subtitleClass)}>Smart Event Access & Registration</div>
        </div>
      )}
    </div>
  );
}
