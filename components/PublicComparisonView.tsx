"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { CheckIcon } from "@/components/ui/icons";
import { SquircleTile, type SquircleTileOption } from "@/components/SquircleTile";
import { VoteResultBar } from "@/components/VoteResultBar";
import { ShareSheet } from "@/components/ShareSheet";
import { Button } from "@/components/ui/Button";
import { tileGridClass, tileSpanClass } from "@/lib/tileLayout";
import { computeVerdict } from "@/lib/verdict";
import { formatCount } from "@/lib/formatCount";
import { formatRelativeTime } from "@/lib/relativeTime";

export interface PublicComparisonOption {
  id: string;
  label: string;
  imageUrl: string | null;
  voteCount: number;
}

export interface PublicComparisonComment {
  id: string;
  body: string;
  author: { username: string; avatarUrl: string | null };
}

export function PublicComparisonView({
  comparisonId,
  prompt,
  options,
  hashtags,
  viewCount,
  createdAt,
  creator,
  commentsLocked,
  commentCount,
  topComments,
  shareUrl,
}: {
  comparisonId: string;
  prompt: string | null;
  options: PublicComparisonOption[];
  hashtags: string[];
  viewCount: number;
  createdAt: string;
  creator: { username: string; avatarUrl: string | null; verified: boolean } | null;
  commentsLocked: boolean;
  commentCount: number;
  topComments: PublicComparisonComment[];
  shareUrl: string;
}) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const isBinary = options.length === 2;
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);
  const pctFor = (o: PublicComparisonOption) => (total > 0 ? Math.round((o.voteCount / total) * 100) : 0);
  const verdict = computeVerdict(options);
  const heading = prompt || options.map((o) => o.label).join(" or ");
  const goToSignup = () => router.push(`/signup?next=${encodeURIComponent(`/comparison/${comparisonId}`)}`);

  const asTiles: SquircleTileOption[] = options.map((o) => ({ id: o.id, label: o.label, imageUrl: o.imageUrl }));

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col gap-4 px-4 pb-10" style={{ paddingTop: "calc(var(--safe-top) + 16px)" }}>
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <Image src="/icons/icon-512.png" alt="" width={22} height={22} className="overflow-hidden rounded-[26%]" />
          <span className="text-sm font-bold tracking-tight text-text-primary">This or That</span>
        </Link>
        <Link href="/login" className="tap-scale glass rounded-full px-3 py-1.5 text-xs font-bold text-text-primary">
          Log in
        </Link>
      </div>

      {creator && (
        <div className="flex items-center gap-2">
          <Avatar name={creator.username} src={creator.avatarUrl} size={30} />
          <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-sm font-semibold text-text-primary">
            @{creator.username}
            {creator.verified && <CheckIcon size={13} className="shrink-0 text-accent" />}
          </span>
          <span className="shrink-0 text-xs text-text-secondary">{formatRelativeTime(createdAt)}</span>
        </div>
      )}

      <p className="text-3xl font-black leading-[1.1] tracking-tight text-text-primary">{heading}</p>
      {hashtags.length > 0 && (
        <div className="-mt-2 flex flex-wrap gap-x-2 text-sm font-semibold text-accent">
          {hashtags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      )}

      {isBinary ? (
        <div className="grid grid-cols-2 gap-3">
          {asTiles.map((option, i) => (
            <SquircleTile
              key={option.id}
              option={option}
              onTap={goToSignup}
              hasVoted
              chosen={false}
              pct={pctFor(options[i])}
              verdict={verdict.winnerIds.includes(option.id) ? (verdict.isTie ? "tied" : "winning") : undefined}
              badgeNumber={i + 1}
            />
          ))}
        </div>
      ) : (
        <div
          className={clsx("grid gap-3", tileGridClass(options.length))}
          style={{ aspectRatio: options.length === 6 ? "1 / 2" : options.length === 5 ? "2 / 3" : "1" }}
        >
          {asTiles.map((option, i) => (
            <SquircleTile
              key={option.id}
              option={option}
              onTap={goToSignup}
              hasVoted
              chosen={false}
              pct={pctFor(options[i])}
              verdict={verdict.winnerIds.includes(option.id) ? (verdict.isTie ? "tied" : "winning") : undefined}
              fill
              className={tileSpanClass(options.length, i)}
              badgeNumber={i + 1}
            />
          ))}
        </div>
      )}

      <VoteResultBar
        options={options.map((o) => ({ id: o.id, label: o.label, pct: pctFor(o), isWinner: verdict.winnerIds.includes(o.id) }))}
      />

      <div className="glass flex flex-col gap-3 rounded-xl px-4 py-3">
        {commentsLocked ? (
          <p className="text-sm font-semibold text-text-secondary">Comments are locked on this debate</p>
        ) : topComments.length > 0 ? (
          <>
            <p className="text-sm font-bold text-text-primary">What people are saying</p>
            <div className="space-y-3">
              {topComments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar name={c.author.username} src={c.author.avatarUrl} size={28} />
                  <p className="min-w-0 flex-1 truncate text-sm text-text-primary">
                    <span className="font-semibold">{c.author.username}</span>{" "}
                    <span className="text-text-secondary">{c.body}</span>
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm font-semibold text-text-secondary">No comments yet</p>
        )}
        <button onClick={() => router.push("/login")} className="tap-scale text-left text-xs font-semibold text-accent">
          Log in to join the conversation{commentCount > 0 ? ` (${formatCount(commentCount)})` : ""}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{formatCount(total)} votes · {formatCount(viewCount)} views</span>
        <button onClick={() => setShareOpen(true)} className="tap-scale font-semibold text-accent">
          Share
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <Button onClick={goToSignup}>Vote in This or That</Button>
        <Link href="/home" className="tap-scale text-center text-sm font-semibold text-text-secondary">
          Open in This or That
        </Link>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        comparisonId={comparisonId}
        heading={heading}
        initialReposted={false}
        initialRepostCount={0}
        loggedIn={false}
        onRequireLogin={() => {
          setShareOpen(false);
          router.push("/signup");
        }}
        shareUrl={shareUrl}
        caption={total > 0 ? `${heading} — ${formatCount(total)} votes so far on This or That` : heading}
      />
    </div>
  );
}
