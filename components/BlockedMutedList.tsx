"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { toggleBlockAction, toggleMuteAction } from "@/lib/actions/blocks";

export interface HiddenUserRow {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export function BlockedMutedList({
  initialBlocked,
  initialMuted,
}: {
  initialBlocked: HiddenUserRow[];
  initialMuted: HiddenUserRow[];
}) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [muted, setMuted] = useState(initialMuted);

  const unblock = (id: string) => {
    setBlocked((prev) => prev.filter((u) => u.id !== id));
    toggleBlockAction(id, false).catch(() => {
      setBlocked((prev) => [...prev, initialBlocked.find((u) => u.id === id)!].filter(Boolean));
    });
  };

  const unmute = (id: string) => {
    setMuted((prev) => prev.filter((u) => u.id !== id));
    toggleMuteAction(id, false).catch(() => {
      setMuted((prev) => [...prev, initialMuted.find((u) => u.id === id)!].filter(Boolean));
    });
  };

  if (blocked.length === 0 && muted.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <p className="text-sm font-semibold text-text-secondary">Blocked & muted</p>
        <p className="mt-2 text-sm text-text-secondary">You haven&rsquo;t blocked or muted anyone.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Blocked & muted</p>

      {blocked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Blocked</p>
          {blocked.map((u) => (
            <Row key={u.id} user={u} actionLabel="Unblock" onAction={() => unblock(u.id)} />
          ))}
        </div>
      )}

      {muted.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Muted</p>
          {muted.map((u) => (
            <Row key={u.id} user={u} actionLabel="Unmute" onAction={() => unmute(u.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  user,
  actionLabel,
  onAction,
}: {
  user: HiddenUserRow;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={user.username} src={user.avatarUrl} size={32} />
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">@{user.username}</p>
      <Button variant="secondary" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
