import { clsx } from "clsx";
import { confidenceLevel, explanationSentence, CONFIDENCE_LABELS } from "@/lib/preferenceEngine";

export interface PreferenceSignalRow {
  label: string;
  wins: number;
  opportunities: number;
  categoryLabel: string | null;
  categoryEmoji: string | null;
}

const BADGE_CLASS: Record<string, string> = {
  strong: "bg-accent text-accent-contrast",
  leaning: "bg-accent/15 text-accent",
  balanced: "bg-border text-text-secondary",
  uncertain: "bg-border text-text-secondary",
  insufficient: "bg-border text-text-secondary",
};

export function TopPreferences({ signals }: { signals: PreferenceSignalRow[] }) {
  if (signals.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-lg font-semibold text-text-primary">Your strongest preferences</p>
      <div className="space-y-3">
        {signals.map((s) => {
          const level = confidenceLevel(s.opportunities, s.wins);
          return (
            <div key={s.label} className="rounded-xl border border-border bg-surface-raised p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-text-primary">
                  {s.categoryEmoji} {s.label}
                </p>
                <span className={clsx("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", BADGE_CLASS[level])}>
                  {CONFIDENCE_LABELS[level]}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {explanationSentence(s.label, s.wins, s.opportunities)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
