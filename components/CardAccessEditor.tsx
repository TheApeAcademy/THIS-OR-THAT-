"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  upsertCardAccessRuleAction,
  blockViewerAction,
  unblockViewerAction,
  deleteCardAccessRuleAction,
  type CardAccessPatch,
} from "@/lib/actions/cardAccess";
import type { CardVisibility } from "@/lib/cardAccess";

type Field = Exclude<keyof CardVisibility, "blocked">;

const FIELDS: { key: Field; label: string }[] = [
  { key: "showDna", label: "Preference DNA" },
  { key: "showPlayScore", label: "Play score" },
  { key: "showStreak", label: "Streak" },
  { key: "showAvatar3d", label: "3D avatar" },
  { key: "showZodiac", label: "Zodiac sign" },
  { key: "showBio", label: "Bio" },
];

export function CardAccessEditor({
  open,
  onClose,
  viewerUsername,
  viewerAvatarUrl,
  viewerId,
  effective,
  initialBlocked,
}: {
  open: boolean;
  onClose: () => void;
  viewerUsername: string;
  viewerAvatarUrl: string | null;
  viewerId: string;
  effective: Omit<CardVisibility, "blocked">;
  initialBlocked: boolean;
}) {
  const [values, setValues] = useState(effective);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [, startTransition] = useTransition();

  const patchField = (key: Field, next: boolean) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    const patch: CardAccessPatch = {};
    patch[dbColumn(key)] = next;
    startTransition(async () => {
      try {
        await upsertCardAccessRuleAction(viewerId, patch);
      } catch {
        setValues((prev) => ({ ...prev, [key]: !next }));
      }
    });
  };

  const toggleBlocked = () => {
    const next = !blocked;
    setBlocked(next);
    startTransition(async () => {
      try {
        await (next ? blockViewerAction(viewerId) : unblockViewerAction(viewerId));
      } catch {
        setBlocked(!next);
      }
    });
  };

  const resetToDefaults = () => {
    startTransition(async () => {
      await deleteCardAccessRuleAction(viewerId);
      onClose();
    });
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-3">
          <Avatar name={viewerUsername} src={viewerAvatarUrl} size={40} />
          <div>
            <p className="font-semibold text-text-primary">@{viewerUsername}</p>
            <p className="text-xs text-text-secondary">What this person can see on your card</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-text-primary">Block this person</p>
            <p className="text-xs text-text-secondary">They&apos;ll see your card is unavailable to them.</p>
          </div>
          <Toggle checked={blocked} onChange={toggleBlocked} label="Block this person" />
        </div>

        {!blocked && (
          <div className="space-y-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-text-primary">{f.label}</p>
                <Toggle checked={values[f.key]} onChange={(next) => patchField(f.key, next)} label={f.label} />
              </div>
            ))}
          </div>
        )}

        <Button variant="secondary" className="w-full" onClick={resetToDefaults}>
          Reset to my defaults
        </Button>
      </div>
    </Sheet>
  );
}

function dbColumn(key: Field): "show_dna" | "show_play_score" | "show_streak" | "show_avatar_3d" | "show_zodiac" | "show_bio" {
  switch (key) {
    case "showDna":
      return "show_dna";
    case "showPlayScore":
      return "show_play_score";
    case "showStreak":
      return "show_streak";
    case "showAvatar3d":
      return "show_avatar_3d";
    case "showZodiac":
      return "show_zodiac";
    case "showBio":
      return "show_bio";
  }
}
