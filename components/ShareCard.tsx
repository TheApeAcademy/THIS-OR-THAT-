"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { CompareForm } from "@/components/CompareForm";
import type { DnaRow } from "@/components/DnaBreakdown";
import type { SocialLinks } from "@/lib/actions/profile";
import { gradientForLabel } from "@/lib/tileArt";

interface ShareCardProps {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  aiSummary: string | null;
  rows: DnaRow[];
  totalVotes: number;
  socialLinks: SocialLinks;
  shareSlug: string;
  viewerUsername?: string | null;
}

const SOCIAL_META: { key: keyof SocialLinks; label: string }[] = [
  { key: "instagram", label: "IG" },
  { key: "tiktok", label: "TT" },
  { key: "twitter", label: "X" },
  { key: "snapchat", label: "SC" },
  { key: "website", label: "🔗" },
];

export function ShareCard({
  username,
  displayName,
  avatarUrl,
  bio,
  aiSummary,
  rows,
  totalVotes,
  socialLinks,
  shareSlug,
  viewerUsername = null,
}: ShareCardProps) {
  const [flipped, setFlipped] = useState(false);
  const topRows = rows.slice(0, 4);
  const activeSocials = SOCIAL_META.filter((s) => socialLinks[s.key]);

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
              bio={bio}
              topRows={topRows}
              totalVotes={totalVotes}
              activeSocials={activeSocials}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <CardBack rows={rows} aiSummary={aiSummary} />
          </div>
        </motion.button>
      </div>

      <p className="text-center text-xs font-medium text-text-secondary">
        Tap the card to {flipped ? "flip back" : "see full Preference DNA"} →
      </p>

      <CopyLinkButton path={`/card/${shareSlug}`} />
      <CompareForm withUsername={username} viewerUsername={viewerUsername} />
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] p-6 text-white shadow-2xl"
      style={{
        background: "linear-gradient(155deg, #050914 0%, #0a1a3d 45%, #0066ff 100%)",
        boxShadow: "0 24px 60px -20px rgba(0, 102, 255, 0.55)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)" }}
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
}: {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  topRows: DnaRow[];
  totalVotes: number;
  activeSocials: typeof SOCIAL_META;
}) {
  return (
    <CardShell>
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-1.5 opacity-80">
          <div className="h-2.5 w-2.5 rounded-full bg-white" />
          <span className="text-[11px] font-bold tracking-[0.15em]">THIS OR THAT</span>
        </div>
        <div
          className="h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white/40"
          style={avatarUrl ? undefined : { background: gradientForLabel(username) }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={username} width={64} height={64} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white/80">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-6">
        <p className="text-[26px] font-extrabold leading-tight tracking-tight">{displayName || username}</p>
        <p className="text-sm font-medium text-white/60">@{username}</p>
      </div>

      {bio && <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-white/85">{bio}</p>}

      <div className="relative mt-auto flex flex-col gap-4 pt-4">
        {topRows.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topRows.map((row) => (
              <span
                key={row.slug}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
              >
                <span>{row.emoji}</span>
                <span>{row.label}</span>
                <span className="text-white/60">{row.pct}%</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/15 pt-3">
          {activeSocials.length > 0 ? (
            <div className="flex gap-2">
              {activeSocials.map((s) => (
                <span
                  key={s.key}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold backdrop-blur-sm"
                >
                  {s.label}
                </span>
              ))}
            </div>
          ) : (
            <span />
          )}
          <span className="text-xs font-semibold text-white/60">{totalVotes} votes</span>
        </div>
      </div>
    </CardShell>
  );
}

function CardBack({ rows, aiSummary }: { rows: DnaRow[]; aiSummary: string | null }) {
  return (
    <CardShell>
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
        {rows.length === 0 && (
          <p className="text-sm text-white/60">Vote on a few comparisons to build your DNA.</p>
        )}
        {rows.map((row) => (
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
    </CardShell>
  );
}
