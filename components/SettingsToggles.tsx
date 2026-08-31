"use client";

import { useState, useTransition } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { updateShowPlayScoreAction, updateShowStreakAction, updateShowDnaAction } from "@/lib/actions/profile";

interface ToggleRow {
  key: "show_play_score" | "show_streak" | "show_dna";
  label: string;
  description: string;
  action: (show: boolean) => Promise<void>;
}

export function SettingsToggles({
  initialShowPlayScore,
  initialShowStreak,
  initialShowDna,
}: {
  initialShowPlayScore: boolean;
  initialShowStreak: boolean;
  initialShowDna: boolean;
}) {
  const [values, setValues] = useState({
    show_play_score: initialShowPlayScore,
    show_streak: initialShowStreak,
    show_dna: initialShowDna,
  });
  const [, startTransition] = useTransition();

  const rows: ToggleRow[] = [
    {
      key: "show_play_score",
      label: "Show Play score on my card",
      description: "Your trivia score is visible on your public Share Card.",
      action: updateShowPlayScoreAction,
    },
    {
      key: "show_streak",
      label: "Show my streak on my card",
      description: "Your 🔥 day streak is visible on your public Share Card.",
      action: updateShowStreakAction,
    },
    {
      key: "show_dna",
      label: "Show Preference DNA on my card",
      description: "The full breakdown on the back of your card is visible to visitors.",
      action: updateShowDnaAction,
    },
  ];

  const toggle = (row: ToggleRow, next: boolean) => {
    setValues((prev) => ({ ...prev, [row.key]: next }));
    startTransition(async () => {
      try {
        await row.action(next);
      } catch {
        setValues((prev) => ({ ...prev, [row.key]: !next }));
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <p className="mb-3 text-sm font-semibold text-text-secondary">Settings</p>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-primary">{row.label}</p>
              <p className="text-xs text-text-secondary">{row.description}</p>
            </div>
            <Toggle checked={values[row.key]} onChange={(next) => toggle(row, next)} label={row.label} />
          </div>
        ))}
      </div>
    </div>
  );
}
