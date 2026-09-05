"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ComparisonCard, type ComparisonCardData } from "@/components/ComparisonCard";
import { SideSplitComments, type SideData } from "@/components/SideSplitComments";
import { ReportButton } from "@/components/ReportButton";
import { DebateAiOpinion } from "@/components/DebateAiOpinion";
import { SponsorToggle } from "@/components/SponsorToggle";
import { GlobalPulse, type GlobalPulseRow } from "@/components/GlobalPulse";
import { CreatorInsights, type InsightsData } from "@/components/CreatorInsights";
import { RankedChoiceVote } from "@/components/RankedChoiceVote";
import { RankedChoiceResults } from "@/components/RankedChoiceResults";
import { voteAction } from "@/lib/actions/vote";
import type { RankedChoiceLabeledRound } from "@/lib/actions/rankedChoice";

interface RivalryRecord {
  winsA: number;
  winsB: number;
  ties: number;
  usernameA: string;
  usernameB: string;
}

interface ComparisonDetailProps {
  comparisonId: string;
  cardData: ComparisonCardData;
  sides: SideData[] | null;
  viewerId: string;
  rivalry?: RivalryRecord | null;
  isAdmin?: boolean;
  isSponsored?: boolean;
  sponsorLabel?: string | null;
  initialAiOpinion?: string | null;
  globalPulse?: GlobalPulseRow[];
  insights?: InsightsData | null;
  postType?: string;
  hasRanked?: boolean;
  rankedResults?: RankedChoiceLabeledRound[];
}

export function ComparisonDetail({
  comparisonId,
  cardData,
  sides,
  viewerId,
  rivalry,
  isAdmin = false,
  isSponsored = false,
  sponsorLabel = null,
  initialAiOpinion = null,
  globalPulse = [],
  insights = null,
  postType = "this_or_that",
  hasRanked = false,
  rankedResults = [],
}: ComparisonDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleVote = (optionId: string) => {
    startTransition(async () => {
      await voteAction(comparisonId, optionId);
      router.refresh();
    });
  };

  const isRankedChoice = postType === "ranked_choice";

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      {rivalry && (
        <div className="flex items-center justify-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-2 text-sm font-semibold text-text-primary">
          <span>⚔️</span>
          <span>
            @{rivalry.usernameA} <span className="text-accent">{rivalry.winsA}</span>
            {" – "}
            <span className="text-accent">{rivalry.winsB}</span> @{rivalry.usernameB}
          </span>
          {rivalry.ties > 0 && (
            <span className="text-xs font-normal text-text-secondary">({rivalry.ties} tied)</span>
          )}
        </div>
      )}

      {isAdmin && (
        <SponsorToggle comparisonId={comparisonId} initialSponsored={isSponsored} initialLabel={sponsorLabel} />
      )}
      {insights && <CreatorInsights insights={insights} />}

      {isRankedChoice && !hasRanked ? (
        <RankedChoiceVote
          comparisonId={comparisonId}
          options={cardData.options.map((o) => ({ id: o.id, label: o.label, imageUrl: o.imageUrl ?? null }))}
          onSubmitted={() => router.refresh()}
        />
      ) : (
        <ComparisonCard comparison={cardData} onVote={handleVote} />
      )}

      {isRankedChoice && hasRanked && (
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="mb-2 text-sm font-semibold text-text-secondary">Runoff results</p>
          <RankedChoiceResults rounds={rankedResults} />
        </div>
      )}

      {!cardData.votedOptionId && !isRankedChoice && (
        <p className="text-center text-sm text-text-secondary">
          {isPending ? "Voting…" : "Vote to unlock the discussion."}
        </p>
      )}
      {cardData.votedOptionId && <DebateAiOpinion comparisonId={comparisonId} initialOpinion={initialAiOpinion} />}
      {cardData.votedOptionId && globalPulse.length > 0 && (
        <GlobalPulse rows={globalPulse} options={cardData.options.map((o) => ({ id: o.id, label: o.label }))} />
      )}
      {cardData.votedOptionId && sides && (
        <SideSplitComments
          comparisonId={comparisonId}
          sides={sides}
          votedOptionId={cardData.votedOptionId}
          viewerId={viewerId}
        />
      )}
      <div className="text-center">
        <ReportButton targetType="comparison" targetId={comparisonId} />
      </div>
    </div>
  );
}
