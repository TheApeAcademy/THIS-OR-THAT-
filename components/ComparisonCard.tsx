"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { gradientForLabel } from "@/lib/tileArt";
import { buzz } from "@/lib/haptics";
import { tileGridClass, tileSpanClass } from "@/lib/tileLayout";
import { formatCount } from "@/lib/formatCount";
import { formatTimeLeft } from "@/lib/countdown";
import { incrementComparisonViewAction } from "@/lib/actions/viewComparison";

export interface ComparisonOptionData {
  id: string;
  label: string;
  imageUrl?: string | null;
  voteCount: number;
}

export interface ComparisonCardData {
  id: string;
  prompt?: string | null;
  viewCount?: number;
  expiresAt?: string | null;
  options: ComparisonOptionData[];
  votedOptionId?: string | null;
}

interface ComparisonCardProps {
  comparison: ComparisonCardData;
  onVote: (optionId: string) => void;
}

const BAR_COLORS = [
  "var(--accent)",
  "var(--accent-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export function ComparisonCard({ comparison, onVote }: ComparisonCardProps) {
  const { id, prompt, options, votedOptionId, viewCount = 0, expiresAt } = comparison;
  const hasVoted = !!votedOptionId;
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);
  const timeLeft = expiresAt ? formatTimeLeft(expiresAt) : null;

  useEffect(() => {
    const key = `viewed:${id}`;
    if (typeof window === "undefined" || sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    incrementComparisonViewAction(id).catch(() => {});
  }, [id]);

  return (
    <div className="glass overflow-hidden rounded-xl">
      {timeLeft && (
        <span className="mx-4 mt-4 inline-block w-fit rounded-full bg-danger/15 px-2.5 py-1 text-xs font-bold text-danger">
          ⏱ {timeLeft}
        </span>
      )}
      {prompt && (
        <p
          className={clsx(
            "px-4 text-xl font-extrabold leading-snug tracking-tight text-text-primary",
            timeLeft ? "pt-2" : "pt-4"
          )}
        >
          {prompt}
        </p>
      )}
      {(viewCount > 0 || total > 0) && (
        <p className="px-4 pt-1 text-xs font-medium text-text-secondary">
          {viewCount > 0 ? `${formatCount(viewCount)} view${viewCount === 1 ? "" : "s"}` : null}
          {viewCount > 0 && total > 0 ? " · " : null}
          {total > 0 ? `${formatCount(total)} vote${total === 1 ? "" : "s"}` : null}
        </p>
      )}
      <div
        className={clsx("grid gap-3 p-3", tileGridClass(options.length))}
        style={
          options.length > 2
            ? { aspectRatio: options.length === 6 ? "1 / 2" : options.length === 5 ? "2 / 3" : "1" }
            : undefined
        }
      >
        {options.map((option, i) => (
          <OptionTile
            key={option.id}
            option={option}
            hasVoted={hasVoted}
            voted={votedOptionId === option.id}
            onVote={onVote}
            spanClass={tileSpanClass(options.length, i)}
            pct={total > 0 ? Math.round((option.voteCount / total) * 100) : Math.round(100 / options.length)}
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
  spanClass,
  pct,
}: {
  option: ComparisonOptionData;
  hasVoted: boolean;
  voted: boolean;
  onVote: (optionId: string) => void;
  spanClass?: string;
  pct?: number;
}) {
  return (
    <div className={clsx("flex flex-col gap-2", spanClass, spanClass && "h-full")}>
      <motion.button
        whileTap={{ scale: 0.94 }}
        className={clsx(
          "tap-scale relative w-full overflow-hidden rounded-[28px]",
          spanClass ? "min-h-0 flex-1" : "aspect-square",
          voted && "ring-4 ring-accent"
        )}
        style={option.imageUrl ? undefined : { background: gradientForLabel(option.label) }}
        onClick={() => {
          buzz(18);
          onVote(option.id);
        }}
      >
        {option.imageUrl ? (
          <Image src={option.imageUrl} alt={option.label} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center">
            <span
              className="line-clamp-3 text-base font-extrabold leading-tight tracking-tight text-white"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}
            >
              {option.label}
            </span>
            {hasVoted && pct !== undefined && <span className="text-xl font-black text-white">{pct}%</span>}
          </div>
        )}
      </motion.button>
      <p className="line-clamp-2 text-center text-base font-extrabold leading-tight tracking-tight text-text-primary">
        {option.label}
      </p>
    </div>
  );
}
