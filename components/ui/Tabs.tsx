"use client";

import { clsx } from "clsx";

export interface TabOption {
  value: string;
  label: string;
}

export function Tabs({
  options,
  value,
  onChange,
}: {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="glass flex gap-1 rounded-full p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "tap-scale flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
            value === o.value ? "bg-accent text-accent-contrast" : "text-text-secondary"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
