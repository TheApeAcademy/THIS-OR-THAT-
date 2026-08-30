"use client";

import { useState, useTransition } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { updateShowPlayScoreAction } from "@/lib/actions/profile";

export function SettingsToggles({ initialShowPlayScore }: { initialShowPlayScore: boolean }) {
  const [showPlayScore, setShowPlayScore] = useState(initialShowPlayScore);
  const [, startTransition] = useTransition();

  const toggle = (next: boolean) => {
    setShowPlayScore(next);
    startTransition(async () => {
      try {
        await updateShowPlayScoreAction(next);
      } catch {
        setShowPlayScore(!next);
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <p className="mb-3 text-sm font-semibold text-text-secondary">Settings</p>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-primary">Show Play score on my card</p>
          <p className="text-xs text-text-secondary">Your trivia score is visible on your public Share Card.</p>
        </div>
        <Toggle checked={showPlayScore} onChange={toggle} label="Show Play score on my card" />
      </div>
    </div>
  );
}
