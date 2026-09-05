"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Avatar } from "@/components/ui/Avatar";
import {
  togglePinAction,
  toggleCommentsLockedAction,
  getVotersAction,
  type VoterRow,
} from "@/lib/actions/comparisonOwner";
import { buzz, HAPTIC } from "@/lib/haptics";

export function PostOptionsMenu({
  open,
  onClose,
  comparisonId,
  initialPinned,
  initialLocked,
}: {
  open: boolean;
  onClose: () => void;
  comparisonId: string;
  initialPinned: boolean;
  initialLocked: boolean;
}) {
  const [pinned, setPinned] = useState(initialPinned);
  const [locked, setLocked] = useState(initialLocked);
  const [votersOpen, setVotersOpen] = useState(false);
  const [voters, setVoters] = useState<VoterRow[] | null>(null);
  const [, startTransition] = useTransition();

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    buzz(HAPTIC.confirm);
    startTransition(async () => {
      try {
        await togglePinAction(comparisonId, next);
      } catch {
        setPinned(!next);
      }
    });
  };

  const toggleLock = () => {
    const next = !locked;
    setLocked(next);
    buzz(HAPTIC.toggle);
    startTransition(async () => {
      try {
        await toggleCommentsLockedAction(comparisonId, next);
      } catch {
        setLocked(!next);
      }
    });
  };

  const openVoters = () => {
    setVotersOpen(true);
    if (voters === null) {
      startTransition(async () => {
        try {
          setVoters(await getVotersAction(comparisonId));
        } catch {
          setVoters([]);
        }
      });
    }
  };

  return (
    <>
      <Sheet open={open} onClose={onClose}>
        <div className="space-y-1 py-1">
          <button
            onClick={togglePin}
            className="tap-scale flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-text-primary"
          >
            {pinned ? "Unpin from profile" : "Pin to profile"}
          </button>
          <button
            onClick={toggleLock}
            className="tap-scale flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-text-primary"
          >
            {locked ? "Unlock comments" : "Lock comments"}
          </button>
          <button
            onClick={openVoters}
            className="tap-scale flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-text-primary"
          >
            View voters
          </button>
        </div>
      </Sheet>

      <Sheet open={votersOpen} onClose={() => setVotersOpen(false)}>
        <div className="max-h-[60vh] space-y-1 overflow-y-auto py-1">
          <p className="px-3 pb-2 text-sm font-bold text-text-primary">Voters</p>
          {voters === null && <p className="px-3 py-4 text-sm text-text-secondary">Loading…</p>}
          {voters?.length === 0 && <p className="px-3 py-4 text-sm text-text-secondary">No votes yet.</p>}
          {voters?.map((v) => (
            <div key={v.userId} className="flex items-center gap-3 px-3 py-2">
              <Avatar name={v.username} src={v.avatarUrl} size={30} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">@{v.username}</span>
              <span className="shrink-0 text-xs font-semibold text-text-secondary">{v.optionLabel}</span>
            </div>
          ))}
        </div>
      </Sheet>
    </>
  );
}
