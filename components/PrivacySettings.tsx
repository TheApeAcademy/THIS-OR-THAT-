"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { updateCardRequiresFollowAction } from "@/lib/actions/profile";

export function PrivacySettings({
  initialCardRequiresFollow,
  onClose,
}: {
  initialCardRequiresFollow: boolean;
  onClose?: () => void;
}) {
  const [requiresFollow, setRequiresFollow] = useState(initialCardRequiresFollow);
  const [, startTransition] = useTransition();

  const toggle = (next: boolean) => {
    setRequiresFollow(next);
    startTransition(async () => {
      try {
        await updateCardRequiresFollowAction(next);
      } catch {
        setRequiresFollow(!next);
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-text-secondary">Privacy</p>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-primary">Only followers can view my card</p>
          <p className="text-xs text-text-secondary">
            Strangers who open your card link see a locked screen until they follow you.
          </p>
        </div>
        <Toggle checked={requiresFollow} onChange={toggle} label="Only followers can view my card" />
      </div>
      <Link href="/profile/connections" className="tap-scale block text-sm font-semibold text-accent">
        Manage blocked people →
      </Link>
      {onClose && (
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Close
        </Button>
      )}
    </div>
  );
}
