"use client";

import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { gradientForLabel, letterForLabel } from "@/lib/tileArt";
import { buzz } from "@/lib/haptics";

export interface ComparisonOptionData {
  id: string;
  label: string;
  imageUrl?: string | null;
  voteCount: number;
}

export interface ComparisonCardData {
  id: string;
  prompt?: string | null;
  options: ComparisonOptionData[];
  votedOptionId?: string | null;
}

interface ComparisonCardProps {
  comparison: ComparisonCardData;
  onVote: (optionId: string) => void;
}

const BAR_COLORS = ["var(--accent)", "var(--accent-2)", "var(--chart-3)", "var(--chart-4)"];

export function ComparisonCard({ comparison, onVote }: ComparisonCardProps) {
  const { prompt, options, votedOptionId } = comparison;
  const hasVoted = !!votedOptionId;
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);

  return (
    <div className="glass overflow-hidden rounded-xl">
      {prompt && (
        <p className="px-4 pt-4 text-xl font-extrabold leading-snug tracking-tight text-text-primary">
          {prompt}
        </p>
      )}
      <div className={clsx("grid gap-3 p-3", options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {options.map((option) => (
          <OptionTile
            key={option.id}
            option={option}
            hasVoted={hasVoted}
            voted={votedOptionId === option.id}
            onVote={onVote}
          />
        ))}
      </div>
      {hasVoted && (
        <div className="space-y-3 px-4 pb-4">
          <div className="space-y-1.5">
            {options.map((option, i) => {
              const pct = total > 0 ? (option.voteCount / total) * 100 : 100 / options.length;
              return (
                <div key={option.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                    <span className="truncate pr-2 text-text-primary">{option.label}</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <ProgressBar percentage={pct} color={BAR_COLORS[i % BAR_COLORS.length]} />
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-text-secondary">{total} votes</p>
          <Link
            href={`/comparison/${comparison.id}`}
            className="block text-center text-sm font-semibold text-accent"
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
    <div className="flex flex-col gap-2">
      <motion.button
        whileTap={hasVoted ? undefined : { scale: 0.94 }}
        className={clsx(
          "tap-scale relative aspect-square w-full overflow-hidden rounded-[28px]",
          voted && "ring-4 ring-accent"
        )}
        style={option.imageUrl ? undefined : { background: gradientForLabel(option.label) }}
        disabled={hasVoted}
        onClick={() => {
          buzz(18);
          onVote(option.id);
        }}
      >
        {option.imageUrl ? (
          <Image src={option.imageUrl} alt={option.label} fill className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white/25">
            {letterForLabel(option.label)}
          </span>
        )}
      </motion.button>
      <p className="line-clamp-2 text-center text-base font-extrabold leading-tight tracking-tight text-text-primary">
        {option.label}
      </p>
    </div>
  );
}
