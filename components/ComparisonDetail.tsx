"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ComparisonCard, type ComparisonCardData } from "@/components/ComparisonCard";
import { SideSplitComments, type SideData } from "@/components/SideSplitComments";
import { ReportButton } from "@/components/ReportButton";
import { DebateAiOpinion } from "@/components/DebateAiOpinion";
import { SponsorToggle } from "@/components/SponsorToggle";
import { GlobalPulse, type GlobalPulseRow } from "@/components/GlobalPulse";
import { setVoteChangeReasonAction } from "@/lib/actions/vote";
import { toggleSaveComparisonAction } from "@/lib/actions/saves";
import { useRealtimeComparison } from "@/lib/useRealtimeComparison";
import { voteWithOfflineSupport } from "@/lib/voteWithOfflineSupport";

interface ComparisonDetailProps {
  comparisonId: string;
  cardData: ComparisonCardData;
  sides: SideData[] | null;
  viewerId: string;
  viewerUsername: string | null;
  initialAiOpinion: string | null;
  isAdmin: boolean;
  isSponsored: boolean;
  sponsorLabel: string | null;
  globalPulse: GlobalPulseRow[];
  pulseOptions: { id: string; label: string }[];
  voteChangeCount: number;
  savedByMe: boolean;
}

export function ComparisonDetail({
  comparisonId,
  cardData,
  sides,
  viewerId,
  viewerUsername,
  initialAiOpinion,
  isAdmin,
  isSponsored,
  sponsorLabel,
  globalPulse,
  pulseOptions,
  voteChangeCount,
  savedByMe,
}: ComparisonDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(savedByMe);
  const [showReasonPrompt, setShowReasonPrompt] = useState(false);
  const [reason, setReason] = useState("");
  const { optionCounts } = useRealtimeComparison(comparisonId);

  const liveCardData =
    Object.keys(optionCounts).length === 0
      ? cardData
      : {
          ...cardData,
          options: cardData.options.map((o) =>
            optionCounts[o.id] !== undefined ? { ...o, voteCount: optionCounts[o.id] } : o
          ),
        };

  const handleVote = (optionId: string) => {
    const isChange = !!cardData.votedOptionId && cardData.votedOptionId !== optionId;
    startTransition(async () => {
      await voteWithOfflineSupport(comparisonId, optionId);
      router.refresh();
      if (isChange) setShowReasonPrompt(true);
    });
  };

  const submitReason = () => {
    const trimmed = reason.trim();
    setShowReasonPrompt(false);
    if (!trimmed) return;
    startTransition(async () => {
      await setVoteChangeReasonAction(comparisonId, trimmed).catch(() => {});
    });
  };

  const toggleSave = () => {
    const next = !saved;
    setSaved(next);
    toggleSaveComparisonAction(comparisonId, next).catch(() => setSaved(!next));
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      {isSponsored && (
        <span className="glass inline-block rounded-full px-3 py-1 text-xs font-bold text-text-secondary">
          Sponsored{sponsorLabel ? ` · ${sponsorLabel}` : ""}
        </span>
      )}
      {isAdmin && (
        <SponsorToggle comparisonId={comparisonId} initialSponsored={isSponsored} initialLabel={sponsorLabel} />
      )}
      <ComparisonCard comparison={liveCardData} onVote={handleVote} savedByMe={saved} onToggleSave={toggleSave} />
      {!cardData.votedOptionId && (
        <p className="text-center text-sm text-text-secondary">
          {isPending ? "Voting…" : "Vote to unlock the discussion."}
        </p>
      )}
      {cardData.votedOptionId && voteChangeCount > 0 && (
        <p className="text-center text-xs text-text-secondary">
          {voteChangeCount} {voteChangeCount === 1 ? "person has" : "people have"} changed their vote
        </p>
      )}
      {showReasonPrompt && (
        <div className="glass space-y-2 rounded-xl p-3">
          <p className="text-sm font-semibold text-text-primary">What changed your mind? (optional)</p>
          <div className="flex gap-2">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us why…"
              className="min-w-0 flex-1 rounded-full border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              autoFocus
            />
            <button
              type="button"
              onClick={submitReason}
              className="tap-scale shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast"
            >
              Save
            </button>
          </div>
        </div>
      )}
      {cardData.votedOptionId && (
        <DebateAiOpinion comparisonId={comparisonId} initialOpinion={initialAiOpinion} />
      )}
      {cardData.votedOptionId && <GlobalPulse rows={globalPulse} options={pulseOptions} />}
      {cardData.votedOptionId && sides && (
        <SideSplitComments
          comparisonId={comparisonId}
          sides={sides}
          votedOptionId={cardData.votedOptionId}
          viewerId={viewerId}
          viewerUsername={viewerUsername}
        />
      )}
      <div className="text-center">
        <ReportButton targetType="comparison" targetId={comparisonId} />
      </div>
    </div>
  );
}
