"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { CompareForm } from "@/components/CompareForm";
import { CardEngagement, type CardCommentData } from "@/components/CardEngagement";
import type { DnaRow } from "@/components/DnaBreakdown";
import type { SocialLinks } from "@/lib/actions/profile";
import { SOCIAL_PLATFORMS } from "@/components/ui/SocialIcons";
import { gradientForLabel } from "@/lib/tileArt";
import { CardFollowButton } from "@/components/CardFollowButton";
import { cardTheme } from "@/lib/cardThemes";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface ShareCardProps {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  aiBio: string | null;
  aiSummary: string | null;
  rows: DnaRow[];
  totalVotes: number;
  socialLinks: SocialLinks;
  shareSlug: string;
  viewerUsername?: string | null;
  cardId: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  comments: CardCommentData[];
  isAuthed: boolean;
  viewerAvatarUrl?: string | null;
  streak: number;
  showPlayScore: boolean;
  showDna?: boolean;
  playScore: { correct: number; total: number };
  qrDataUrl: string | null;
  viewerId?: string | null;
  profileUserId?: string;
  followedByMe?: boolean;
  viewCount?: number;
  theme?: string;
  verificationType?: "none" | "identity" | "social";
}

export function ShareCard({
  username,
  displayName,
  avatarUrl,
  bio,
  aiBio,
  aiSummary,
  rows,
  totalVotes,
  socialLinks,
  shareSlug,
  viewerUsername = null,
  cardId,
  likeCount,
  likedByMe,
  commentCount,
  comments,
  isAuthed,
  viewerAvatarUrl = null,
  streak,
  showPlayScore,
  showDna = true,
  playScore,
  qrDataUrl,
  viewerId = null,
  profileUserId,
  followedByMe = false,
  viewCount,
  theme = "blue",
  verificationType = "none",
}: ShareCardProps) {
  const [flipped, setFlipped] = useState(false);
  const topRows = rows.slice(0, 4);
  const activeSocials = SOCIAL_PLATFORMS.filter((s) => socialLinks[s.key]);
  const isSelf = !profileUserId || viewerId === profileUserId;

  return (
    <div
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col gap-6 px-4 py-8"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
    >
      <div style={{ perspective: 1600 }} className="mx-auto w-full max-w-sm">
        <motion.button
          type="button"
          aria-label="Flip card"
          onClick={() => setFlipped((f) => !f)}
          className="relative block aspect-[3/4.6] w-full text-left"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            <CardFront
              username={username}
              displayName={displayName}
              avatarUrl={avatarUrl}
              bio={aiBio || bio}
              topRows={topRows}
              totalVotes={totalVotes}
              activeSocials={activeSocials}
              socialLinks={socialLinks}
              streak={streak}
              showPlayScore={showPlayScore}
              playScore={playScore}
              theme={theme}
              verificationType={verificationType}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <CardBack rows={rows} aiSummary={aiSummary} qrDataUrl={qrDataUrl} showDna={showDna} theme={theme} />
          </div>
        </motion.button>
      </div>

      {!isSelf && profileUserId && (
        <CardFollowButton profileUserId={profileUserId} viewerId={viewerId} initialFollowing={followedByMe} />
      )}

      {isSelf && viewCount !== undefined && (
        <p className="text-center text-xs font-medium text-text-secondary">
          👁️ {viewCount} card view{viewCount === 1 ? "" : "s"}
        </p>
      )}

      <p className="text-center text-xs font-medium text-text-secondary">
        Tap the card to {flipped ? "flip back" : "see full Preference DNA"} →
      </p>

      <CopyLinkButton path={`/card/${shareSlug}`} />
      <CardEngagement
        cardId={cardId}
        shareSlug={shareSlug}
        initialLikeCount={likeCount}
        likedByMe={likedByMe}
        isAuthed={isAuthed}
        viewerUsername={viewerUsername}
        viewerAvatarUrl={viewerAvatarUrl}
        comments={comments}
        commentCount={commentCount}
      />
      <CompareForm withUsername={username} viewerUsername={viewerUsername} />
    </div>
  );
}

function CardShell({ theme = "blue", children }: { theme?: string; children: React.ReactNode }) {
  const t = cardTheme(theme);
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] p-6 text-white shadow-2xl"
      style={{
        background: t.gradient,
        boxShadow: t.glow,
      }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${t.accent}, transparent 70%)` }}
      />
      {children}
    </div>
  );
}

function CardFront({
  username,
  displayName,
  avatarUrl,
  bio,
  topRows,
  totalVotes,
  activeSocials,
  socialLinks,
  streak,
  showPlayScore,
  playScore,
  theme,
  verificationType = "none",
}: {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  topRows: DnaRow[];
  totalVotes: number;
  activeSocials: typeof SOCIAL_PLATFORMS;
  socialLinks: SocialLinks;
  streak: number;
  showPlayScore: boolean;
  playScore: { correct: number; total: number };
  theme?: string;
  verificationType?: "none" | "identity" | "social";
}) {
  return (
    <CardShell theme={theme}>
      <div className="relative flex h-full gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5 opacity-80">
            <div className="h-2.5 w-2.5 rounded-full bg-white" />
            <span className="text-[11px] font-bold tracking-[0.15em]">THIS OR THAT</span>
          </div>

          <div className="mt-5">
            <p className="flex items-center gap-1.5 text-2xl font-extrabold leading-tight tracking-tight">
              {displayName || username}
              {verificationType !== "none" && <VerifiedBadge type={verificationType} />}
            </p>
            <p className="text-sm font-medium text-white/60">@{username}</p>
          </div>

          {bio && <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/85">{bio}</p>}

          {(streak > 0 || (showPlayScore && playScore.total > 0)) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold">
                  🔥 {streak} day{streak === 1 ? "" : "s"}
                </span>
              )}
              {showPlayScore && playScore.total > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold">
                  🧠 {playScore.correct}/{playScore.total}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex flex-col gap-3 pt-4">
            {topRows.length > 0 && (
              <div className="flex flex-col items-start gap-1.5">
                {topRows.map((row) => (
                  <span
                    key={row.slug}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                    }}
                  >
                    <span>{row.emoji}</span>
                    <span>{row.label}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/15 pt-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {activeSocials.map((s) => (
                  <a
                    key={s.key}
                    href={socialLinks[s.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <s.icon size={12} />
                  </a>
                ))}
              </div>
              <span className="text-[11px] font-semibold text-white/50">{totalVotes} votes</span>
            </div>
          </div>
        </div>

        <div
          className="relative w-[38%] shrink-0 self-stretch overflow-hidden rounded-[24px]"
          style={{
            background: avatarUrl ? undefined : gradientForLabel(displayName || username),
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          {avatarUrl && avatarUrl.startsWith("data:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={username} className="absolute inset-0 h-full w-full object-cover" />
          ) : avatarUrl ? (
            <Image src={avatarUrl} alt={username} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl font-black text-white/30">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </div>
    </CardShell>
  );
}

function CardBack({
  rows,
  aiSummary,
  qrDataUrl,
  showDna,
  theme,
}: {
  rows: DnaRow[];
  aiSummary: string | null;
  qrDataUrl: string | null;
  showDna: boolean;
  theme?: string;
}) {
  return (
    <CardShell theme={theme}>
      <div className="relative flex items-center gap-1.5 opacity-80">
        <div className="h-2.5 w-2.5 rounded-full bg-white" />
        <span className="text-[11px] font-bold tracking-[0.15em]">PREFERENCE DNA</span>
      </div>

      {aiSummary && (
        <p className="relative mt-4 line-clamp-4 text-sm italic leading-relaxed text-white/85">
          &ldquo;{aiSummary}&rdquo;
        </p>
      )}

      <div className="relative mt-5 flex-1 space-y-3 overflow-hidden">
        {!showDna && <p className="text-sm text-white/60">This person keeps their Preference DNA private.</p>}
        {showDna && rows.length === 0 && (
          <p className="text-sm text-white/60">Vote on a few comparisons to build your DNA.</p>
        )}
        {showDna &&
          rows.slice(0, 6).map((row) => (
            <div key={row.slug}>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                <span>
                  {row.emoji} {row.label}
                </span>
                <span className="text-white/60">{row.pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(row.pct, 3)}%` }} />
              </div>
            </div>
          ))}
      </div>

      {qrDataUrl && (
        <div className="relative flex items-center gap-3 border-t border-white/15 pt-3">
          <div className="shrink-0 overflow-hidden rounded-lg bg-white p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code to this profile" width={52} height={52} />
          </div>
          <p className="text-[11px] font-medium leading-snug text-white/60">
            Scan to open this profile on This or That
          </p>
        </div>
      )}
    </CardShell>
  );
}
