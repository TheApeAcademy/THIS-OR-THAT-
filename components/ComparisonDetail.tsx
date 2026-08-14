"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ComparisonCard, type ComparisonCardData } from "@/components/ComparisonCard";
import { SideSplitComments, type SideData } from "@/components/SideSplitComments";
import { voteAction } from "@/lib/actions/vote";

interface ComparisonDetailProps {
  comparisonId: string;
  cardData: ComparisonCardData;
  sides: [SideData, SideData] | null;
}

export function ComparisonDetail({ comparisonId, cardData, sides }: ComparisonDetailProps) {
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
      <ComparisonCard comparison={cardData} onVote={handleVote} />
      {!cardData.votedOptionId && (
        <p className="text-center text-sm text-text-secondary">
          {isPending ? "Voting…" : "Vote to unlock the discussion."}
        </p>
      )}
      {cardData.votedOptionId && sides && (
        <SideSplitComments comparisonId={comparisonId} sides={sides} votedOptionId={cardData.votedOptionId} />
      )}
    </div>
  );
}
