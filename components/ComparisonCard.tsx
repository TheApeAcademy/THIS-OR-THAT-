"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { VerdictBadge, type VerdictState } from "@/components/VerdictBadge";
import { VerdictBanner } from "@/components/VerdictBanner";
import { buzz } from "@/lib/haptics";
import { tileGridClass, tileSpanClass } from "@/lib/tileLayout";
import { computeVerdict } from "@/lib/verdict";
import { formatCount } from "@/lib/formatCount";
import { formatTimeLeft, isExpired } from "@/lib/countdown";
import { incrementComparisonViewAction } from "@/lib/actions/viewComparison";

export interface ComparisonOptionData {
  id: string;
  label: string;
  imageUrl?: string | null;
  voteCount: number;
  /** Set on Duel Mode options — the debater's own point, shown on their tile. */
  statement?: string | null;
  claimant?: { username: string; avatarUrl: string | null } | null;
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
  const expired = isExpired(expiresAt ?? null);
  const verdict = computeVerdict(options);
  const verdictFor = (optionId: string): VerdictState =>
    verdict.winnerIds.includes(optionId) ? (verdict.isTie ? "tied" : "winning") : undefined;
  const engagement = total + viewCount;

  useEffect(() => {
    const key = `viewed:${id}`;
    if (typeof window === "undefined" || sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    incrementComparisonViewAction(id).catch(() => {});
  }, [id]);

  return (
    <div className="glass overflow-hidden rounded-xl">
      {expiresAt && (
        <div className="mx-4 mt-4">
          {expired ? (
            <VerdictBanner comparisonId={id} options={options} />
          ) : (
            timeLeft && (
              <span className="inline-block w-fit rounded-full bg-danger/15 px-2.5 py-1 text-xs font-bold text-danger">
                ⏱ {timeLeft}
              </span>
            )
          )}
        </div>
      )}
      {prompt && (
        <p
          className={clsx(
            "px-4 text-xl font-extrabold leading-snug tracking-tight text-text-primary",
            timeLeft || expired ? "pt-2" : "pt-4"
          )}
        >
          {prompt}
        </p>
      )}
      {engagement > 0 && (
        <p className="px-4 pt-1.5 flex items-baseline gap-1 text-sm font-bold text-text-primary">
          <AnimatedNumber value={engagement} />
          <span className="font-semibold text-text-secondary">people debating this</span>
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
            verdict={verdictFor(option.id)}
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
  verdict,
}: {
  option: ComparisonOptionData;
  hasVoted: boolean;
  voted: boolean;
  onVote: (optionId: string) => void;
  spanClass?: string;
  pct?: number;
  verdict?: VerdictState;
}) {
  return (
    <div className={clsx("flex flex-col gap-2", spanClass, spanClass && "h-full")}>
      <motion.button
        whileTap={{ scale: 0.94 }}
        className={clsx(
          "tap-scale relative w-full overflow-hidden rounded-[28px]",
          spanClass ? "min-h-0 flex-1" : "aspect-square",
          !option.imageUrl && "text-tile",
          voted && "ring-4 ring-accent"
        )}
        onClick={() => {
          buzz(18);
          onVote(option.id);
        }}
      >
        {option.imageUrl ? (
          <Image src={option.imageUrl} alt={option.label} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center">
            {option.claimant && (
              <Avatar name={option.claimant.username} src={option.claimant.avatarUrl} size={32} />
            )}
            <span
              className="line-clamp-3 text-base font-extrabold leading-tight tracking-tight text-white"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}
            >
              {option.claimant ? `@${option.claimant.username}` : option.label}
            </span>
            {option.statement && (
              <span className="line-clamp-3 text-xs font-medium text-white/85">&ldquo;{option.statement}&rdquo;</span>
            )}
            {hasVoted && pct !== undefined && <span className="text-xl font-black text-white">{pct}%</span>}
          </div>
        )}
        <VerdictBadge state={hasVoted ? verdict : undefined} />
      </motion.button>
      <p className="line-clamp-2 text-center text-base font-extrabold leading-tight tracking-tight text-text-primary">
        {option.label}
      </p>
    </div>
  );
}
