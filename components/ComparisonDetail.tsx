"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ComparisonCard, type ComparisonCardData } from "@/components/ComparisonCard";
import { SideSplitComments, type SideData } from "@/components/SideSplitComments";
import { ReportButton } from "@/components/ReportButton";
import { DebateAiOpinion } from "@/components/DebateAiOpinion";
import { SponsorToggle } from "@/components/SponsorToggle";
import { GlobalPulse, type GlobalPulseRow } from "@/components/GlobalPulse";
import { voteAction } from "@/lib/actions/vote";

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
}: ComparisonDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleVote = (optionId: string) => {
    startTransition(async () => {
      await voteAction(comparisonId, optionId);
      router.refresh();
    });
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
      <ComparisonCard comparison={cardData} onVote={handleVote} />
      {!cardData.votedOptionId && (
        <p className="text-center text-sm text-text-secondary">
          {isPending ? "Voting…" : "Vote to unlock the discussion."}
        </p>
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
