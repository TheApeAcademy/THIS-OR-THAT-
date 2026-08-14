"use client";

import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { ProgressBar } from "@/components/ui/ProgressBar";

export interface ComparisonOptionData {
  id: string;
  label: string;
  imageUrl?: string | null;
  voteCount: number;
}

export interface ComparisonCardData {
  id: string;
  prompt?: string | null;
  optionA: ComparisonOptionData;
  optionB: ComparisonOptionData;
  votedOptionId?: string | null;
}

interface ComparisonCardProps {
  comparison: ComparisonCardData;
  onVote: (optionId: string) => void;
}

export function ComparisonCard({ comparison, onVote }: ComparisonCardProps) {
  const { prompt, optionA, optionB, votedOptionId } = comparison;
  const hasVoted = !!votedOptionId;
  const total = optionA.voteCount + optionB.voteCount;
  const pctA = total > 0 ? (optionA.voteCount / total) * 100 : 50;
  const pctB = total > 0 ? 100 - pctA : 50;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
      {prompt && (
        <p className="px-4 pt-4 text-sm font-medium text-text-secondary">{prompt}</p>
      )}
      <div className="grid grid-cols-2 gap-px bg-border">
        <OptionTile option={optionA} hasVoted={hasVoted} voted={votedOptionId === optionA.id} onVote={onVote} />
        <OptionTile option={optionB} hasVoted={hasVoted} voted={votedOptionId === optionB.id} onVote={onVote} />
      </div>
      {hasVoted && (
        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span>{Math.round(pctA)}%</span>
            <span>{Math.round(pctB)}%</span>
          </div>
          <div className="flex gap-1">
            <ProgressBar percentage={pctA} color="var(--accent)" />
            <ProgressBar percentage={pctB} color="var(--text-secondary)" />
          </div>
          <p className="text-center text-xs text-text-secondary">{total} votes</p>
          <Link
            href={`/comparison/${comparison.id}`}
            className="block text-center text-sm font-medium text-accent"
          >
            Why? View discussion →
          </Link>
        </div>
      )}
    </div>
  );
}

function OptionTile({
  option,
  hasVoted,
  voted,
  onVote,
}: {
  option: ComparisonOptionData;
  hasVoted: boolean;
  voted: boolean;
  onVote: (optionId: string) => void;
}) {
  return (
    <button
      className={clsx(
        "tap-scale relative flex aspect-square flex-col items-center justify-center gap-2 bg-surface-raised p-4 text-center",
        voted && "ring-2 ring-inset ring-accent"
      )}
      disabled={hasVoted}
      onClick={() => onVote(option.id)}
    >
      {option.imageUrl && (
        <Image
          src={option.imageUrl}
          alt={option.label}
          fill
          className="object-cover opacity-90"
        />
      )}
      <span className="relative text-lg font-semibold text-text-primary">{option.label}</span>
    </button>
  );
}
