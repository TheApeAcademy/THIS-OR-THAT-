"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { setFeatureFlagPctAction, type FeatureFlagRow } from "@/lib/actions/admin";

interface BackfillResult {
  updated: number;
  skipped: number;
  remaining: number;
  error?: string;
}

function StockPhotoBackfill() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<BackfillResult>("backfill-stock-images");
      setResult(error || data?.error ? { updated: 0, skipped: 0, remaining: 0, error: "Backfill failed - check that UNSPLASH_ACCESS_KEY/PEXELS_API_KEY are set." } : data!);
    } catch {
      setResult({ updated: 0, skipped: 0, remaining: 0, error: "Backfill failed to run." });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-primary">Stock-photo backfill</p>
      <p className="text-xs text-text-secondary">
        Replaces placeholder images with real Unsplash/Pexels photos matched to each option&apos;s label. Processes up
        to 50 options per click - click again if any remain.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="tap-scale rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-contrast disabled:opacity-50"
      >
        {running ? "Running…" : "Run stock-photo backfill"}
      </button>
      {result?.error && <p className="text-sm text-danger">{result.error}</p>}
      {result && !result.error && (
        <p className="text-sm text-text-secondary">
          Updated {result.updated}, skipped {result.skipped}, {result.remaining} still remaining.
        </p>
      )}
    </div>
  );
}

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

  return (
    <div className="space-y-3">
      <StockPhotoBackfill />
      {rows.length === 0 && <p className="py-8 text-center text-sm text-text-secondary">No feature flags defined.</p>}
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
