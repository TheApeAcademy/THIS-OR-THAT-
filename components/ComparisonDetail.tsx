"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ComparisonCard, type ComparisonCardData } from "@/components/ComparisonCard";
import { SideSplitComments, type SideData } from "@/components/SideSplitComments";
import { ReportButton } from "@/components/ReportButton";
import { voteAction } from "@/lib/actions/vote";

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
  rivalry?: RivalryRecord | null;
}

export function ComparisonDetail({ comparisonId, cardData, sides, rivalry }: ComparisonDetailProps) {
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
      <ComparisonCard comparison={cardData} onVote={handleVote} />
      {!cardData.votedOptionId && (
        <p className="text-center text-sm text-text-secondary">
          {isPending ? "Voting…" : "Vote to unlock the discussion."}
        </p>
      )}
      {cardData.votedOptionId && sides && (
        <SideSplitComments comparisonId={comparisonId} sides={sides} votedOptionId={cardData.votedOptionId} />
      )}
      <div className="text-center">
        <ReportButton targetType="comparison" targetId={comparisonId} />
      </div>
    </div>
  );
}
