"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import {
  NOTIFICATION_CATEGORIES,
  updateNotificationPrefsAction,
  type NotificationCategoryKey,
} from "@/lib/actions/notificationPrefs";

export function NotificationSettings({
  initialMutedTypes,
  onClose,
}: {
  initialMutedTypes: string[];
  onClose?: () => void;
}) {
  const mutedSet = new Set(initialMutedTypes);
  const initialMutedCategories = NOTIFICATION_CATEGORIES.filter((c) => c.types.every((t) => mutedSet.has(t))).map(
    (c) => c.key
  );

  const [muted, setMuted] = useState<Set<NotificationCategoryKey>>(new Set(initialMutedCategories));
  const [, startTransition] = useTransition();

  const toggle = (key: NotificationCategoryKey, on: boolean) => {
    const next = new Set(muted);
    if (on) next.delete(key);
    else next.add(key);
    setMuted(next);
    startTransition(async () => {
      try {
        await updateNotificationPrefsAction([...next]);
      } catch {
        setMuted(muted);
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-text-secondary">Notifications</p>
      <p className="text-xs text-text-secondary">
        Turn off the kinds of notifications you don&apos;t want to see. This won&apos;t affect anyone else&apos;s
        notifications about you.
      </p>
      <div className="space-y-3">
        {NOTIFICATION_CATEGORIES.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-text-primary">{c.label}</p>
            <Toggle checked={!muted.has(c.key)} onChange={(on) => toggle(c.key, on)} label={c.label} />
          </div>
        ))}
      </div>
      {onClose && (
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Close
        </Button>
      )}
    </div>
  );
}
