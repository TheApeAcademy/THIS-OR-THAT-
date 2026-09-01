"use client";

import { useState, useTransition } from "react";
import { Toggle } from "@/components/ui/Toggle";
import {
  updateShowPlayScoreAction,
  updateShowStreakAction,
  updateShowDnaAction,
  updateShowAvatar3dAction,
  updateShowZodiacAction,
  updateShowBioAction,
} from "@/lib/actions/profile";

type ToggleKey = "show_play_score" | "show_streak" | "show_dna" | "show_avatar_3d" | "show_zodiac" | "show_bio";

interface ToggleRow {
  key: ToggleKey;
  label: string;
  description: string;
  action: (show: boolean) => Promise<void>;
}

export function SettingsToggles({
  initialShowPlayScore,
  initialShowStreak,
  initialShowDna,
  initialShowAvatar3d,
  initialShowZodiac,
  initialShowBio,
}: {
  initialShowPlayScore: boolean;
  initialShowStreak: boolean;
  initialShowDna: boolean;
  initialShowAvatar3d: boolean;
  initialShowZodiac: boolean;
  initialShowBio: boolean;
}) {
  const [values, setValues] = useState<Record<ToggleKey, boolean>>({
    show_play_score: initialShowPlayScore,
    show_streak: initialShowStreak,
    show_dna: initialShowDna,
    show_avatar_3d: initialShowAvatar3d,
    show_zodiac: initialShowZodiac,
    show_bio: initialShowBio,
  });
  const [, startTransition] = useTransition();

  const rows: ToggleRow[] = [
    {
      key: "show_bio",
      label: "Show my bio on my card",
      description: "Your short bio line is visible on your public Share Card.",
      action: updateShowBioAction,
    },
    {
      key: "show_avatar_3d",
      label: "Show my 3D avatar on my card",
      description: "Your live 3D avatar is visible instead of a flat photo.",
      action: updateShowAvatar3dAction,
    },
    {
      key: "show_zodiac",
      label: "Show my zodiac sign on my card",
      description: "Derived from your birthdate, shown next to your name.",
      action: updateShowZodiacAction,
    },
    {
      key: "show_play_score",
      label: "Show Play score on my card",
      description: "Your trivia score is visible on your public Share Card.",
      action: updateShowPlayScoreAction,
    },
    {
      key: "show_streak",
      label: "Show my streak on my card",
      description: "Your day streak is visible on your public Share Card.",
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
