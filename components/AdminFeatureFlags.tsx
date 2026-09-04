"use client";

import { useState, useTransition } from "react";
import { setFeatureFlagPctAction, type FeatureFlagRow } from "@/lib/actions/admin";

export function AdminFeatureFlags({ flags }: { flags: FeatureFlagRow[] }) {
  const [rows, setRows] = useState(flags);
  const [, startTransition] = useTransition();
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const setPct = (key: string, pct: number) => {
    setRows((prev) => prev.map((f) => (f.key === key ? { ...f, enabledPct: pct } : f)));
  };

  const commit = (key: string, pct: number) => {
    startTransition(async () => {
      await setFeatureFlagPctAction(key, pct).catch(() => {});
      setSavedKey(key);
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1200);
    });
  };

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-text-secondary">No feature flags defined.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((flag) => (
        <div key={flag.key} className="space-y-2 rounded-xl border border-border bg-surface-raised p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary">{flag.key}</p>
            <span className="text-sm font-bold text-accent">
              {flag.enabledPct}% {savedKey === flag.key && <span className="text-success">✓</span>}
            </span>
          </div>
          {flag.description && <p className="text-xs text-text-secondary">{flag.description}</p>}
          <input
            type="range"
            min={0}
            max={100}
            value={flag.enabledPct}
            aria-label={`${flag.key} rollout percentage`}
            onChange={(e) => setPct(flag.key, Number(e.target.value))}
            onMouseUp={(e) => commit(flag.key, Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => commit(flag.key, Number((e.target as HTMLInputElement).value))}
            className="w-full accent-accent"
          />
        </div>
      ))}
    </div>
  );
}
