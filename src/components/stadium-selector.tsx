"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";

const stadiums = [
  "National Stadium",
  "Addis Ababa Stadium",
  "Bahir Dar International Stadium",
  "Dire Dawa Stadium",
  "Hawassa Stadium",
];

export function StadiumSelector({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState(() => {
    if (typeof window === "undefined") return stadiums[0];
    return window.localStorage.getItem("sms-selected-stadium") ?? stadiums[0];
  });

  function update(value: string) {
    setSelected(value);
    window.localStorage.setItem("sms-selected-stadium", value);
  }

  return (
    <label className="flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--stroke)", background: "var(--surface)" }}>
      <Building2 className="shrink-0" size={16} style={{ color: "var(--adey-yellow)" }} />
      {!compact ? <span className="hidden text-[var(--text-muted)] sm:inline">Stadium</span> : null}
      <select
        aria-label="Select stadium"
        className="min-w-0 max-w-[145px] bg-transparent text-sm font-semibold outline-none sm:max-w-[220px]"
        onChange={(event) => update(event.target.value)}
        style={{ color: "var(--text-strong)" }}
        value={selected}
      >
        {stadiums.map((stadium) => (
          <option key={stadium}>{stadium}</option>
        ))}
      </select>
    </label>
  );
}

export const stadiumOptions = stadiums;
