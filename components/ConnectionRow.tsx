"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CardAccessEditor } from "@/components/CardAccessEditor";
import { formatRelativeTime } from "@/lib/relativeTime";
import type { CardVisibility } from "@/lib/cardAccess";

export function ConnectionRow({
  viewerId,
  username,
  avatarUrl,
  viewCount,
  lastViewedAt,
  followsYou,
  effective,
}: {
  viewerId: string;
  username: string;
  avatarUrl: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  followsYou: boolean;
  effective: CardVisibility;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-scale flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-raised"
      >
        <Avatar name={username} src={avatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">@{username}</p>
          <p className="text-xs text-text-secondary">
            {viewCount > 0
              ? `Viewed ${viewCount} time${viewCount === 1 ? "" : "s"}${lastViewedAt ? ` · last ${formatRelativeTime(lastViewedAt)}` : ""}`
              : "Hasn't viewed your card"}
            {followsYou ? " · Follows you" : ""}
          </p>
        </div>
        {effective.blocked && (
          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-bold text-danger">Blocked</span>
        )}
      </button>

      <CardAccessEditor
        open={open}
        onClose={() => setOpen(false)}
        viewerId={viewerId}
        viewerUsername={username}
        viewerAvatarUrl={avatarUrl}
        effective={effective}
        initialBlocked={effective.blocked}
      />
    </>
  );
}
