"use client";

import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { gradientForLabel, letterForLabel } from "@/lib/tileArt";
import { gridColsClass } from "@/lib/optionGrid";

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
  hashtags?: string[];
}

interface ComparisonCardProps {
  comparison: ComparisonCardData;
  onVote: (optionId: string) => void;
  savedByMe?: boolean;
  onToggleSave?: () => void;
}

const BAR_COLORS = ["var(--accent)", "var(--accent-2)", "#a78bfa", "#34d399"];

export function ComparisonCard({ comparison, onVote, savedByMe, onToggleSave }: ComparisonCardProps) {
  const { prompt, options, votedOptionId, hashtags } = comparison;
  const hasVoted = !!votedOptionId;
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);

  return (
    <div className="glass overflow-hidden rounded-2xl">
      {(prompt || onToggleSave) && (
        <div className="flex items-start justify-between gap-2 px-4 pt-4">
          {prompt && (
            <p className="text-xl font-extrabold leading-snug tracking-tight text-text-primary">{prompt}</p>
          )}
          {onToggleSave && (
            <button
              type="button"
              aria-label={savedByMe ? "Remove from saved" : "Save"}
              onClick={onToggleSave}
              className="tap-scale shrink-0 text-text-secondary"
            >
              <SaveIcon filled={!!savedByMe} />
            </button>
          )}
        </div>
      )}
      {hashtags && hashtags.length > 0 && (
        <div className="flex flex-wrap gap-x-2 px-4 pt-1 text-sm font-semibold text-accent">
          {hashtags.map((tag) => (
            <Link key={tag} href={`/hashtag/${tag}`}>
              #{tag}
            </Link>
          ))}
        </div>
      )}
      <div className={clsx("grid gap-3 p-3", gridColsClass(options.length))}>
        {options.map((option) => (
          <OptionTile key={option.id} option={option} voted={votedOptionId === option.id} onVote={onVote} />
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
  voted,
  onVote,
}: {
  option: ComparisonOptionData;
  voted: boolean;
  onVote: (optionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        className={clsx(
          "tap-scale relative aspect-square w-full overflow-hidden rounded-[28px]",
          voted && "ring-4 ring-accent"
        )}
        style={option.imageUrl ? undefined : { background: gradientForLabel(option.label) }}
        disabled={voted}
        onClick={() => onVote(option.id)}
      >
        {option.imageUrl ? (
          <Image src={option.imageUrl} alt={option.label} fill className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white/25">
            {letterForLabel(option.label)}
          </span>
        )}
      </button>
      <p className="line-clamp-2 text-center text-base font-extrabold leading-tight tracking-tight text-text-primary">
        {option.label}
      </p>
    </div>
  );
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "var(--accent)" : "none"}>
      <path
        d="M6 4h12v16l-6-4-6 4V4Z"
        stroke={filled ? "var(--accent)" : "currentColor"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
