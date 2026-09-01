"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { SparkleIcon } from "@/components/ui/icons";
import { getArchetype } from "@/lib/archetype";
import { SPRING_BOUNCY } from "@/lib/motion";

const Avatar3DViewer = dynamic(
  () => import("@/components/Avatar3DViewer").then((m) => m.Avatar3DViewer),
  { ssr: false }
);

interface RevealDnaRow {
  slug: string;
  label: string;
  emoji: string | null;
}

/**
 * A deliberately lightweight, front-face-only preview of the freshly-built
 * TOT card — shown once, right after onboarding, as the card's proper
 * introduction. Not the real ShareCard: at this exact moment there's no
 * cardId/likeCount/comments yet, so this reuses only the data OnboardingReview
 * already has in hand rather than forcing the full component's prop surface.
 */
export function CardRevealCard({
  username,
  displayName,
  bio,
  profilePhotoUrl,
  avatarModelUrl,
  topRows,
  onRevealComplete,
}: {
  username: string;
  displayName: string | null;
  bio: string;
  profilePhotoUrl: string | null;
  avatarModelUrl: string | null;
  topRows: RevealDnaRow[];
  onRevealComplete?: () => void;
}) {
  const [wiggling, setWiggling] = useState(true);
  const archetype = getArchetype(topRows[0]?.slug, username);

  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0, rotateZ: -10 }}
      animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
      transition={SPRING_BOUNCY}
      onAnimationComplete={() => {
        setWiggling(false);
        onRevealComplete?.();
      }}
      className="mx-auto w-full max-w-sm"
    >
      <motion.div
        animate={wiggling ? { rotate: [0, -2, 2, -1.5, 1.5, 0] } : { rotate: 0 }}
        transition={{ duration: 0.9, delay: 0.3 }}
        className="relative flex aspect-[3/4.9] flex-col overflow-hidden rounded-2xl p-6 text-white shadow-2xl"
        style={{
          background: "linear-gradient(155deg, #050914 0%, #0a1a3d 45%, #0066ff 100%)",
          boxShadow: "0 24px 60px -20px rgba(0, 102, 255, 0.55)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)" }}
        />

        <div className="relative flex items-center gap-1.5 opacity-80">
          <div className="h-2.5 w-2.5 rounded-full bg-white" />
          <span className="text-[11px] font-bold tracking-[0.15em]">THIS OR THAT</span>
        </div>

        <div className="relative mt-6 flex flex-1 flex-col items-center justify-center gap-3 text-center">
          {avatarModelUrl ? (
            <div className="h-40 w-32 overflow-hidden rounded-[24px] border border-white/20">
              <Avatar3DViewer url={avatarModelUrl} className="h-full w-full" autoRotate interactive={false} standing />
            </div>
          ) : (
            <Avatar
              name={displayName || username}
              src={profilePhotoUrl}
              size={96}
              className="border border-white/20"
            />
          )}

          <div>
            <p className="text-2xl font-extrabold leading-tight tracking-tight">{displayName || username}</p>
            <p className="text-sm font-medium text-white/60">@{username}</p>
          </div>

          {archetype && (
            <p className="flex items-center gap-1.5 text-sm font-extrabold" style={{ color: "#7dd3fc" }}>
              <SparkleIcon size={14} />
              {archetype}
            </p>
          )}

          {bio && <p className="line-clamp-3 text-sm leading-relaxed text-white/85">{bio}</p>}

          {topRows.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {topRows.slice(0, 3).map((row) => (
                <span
                  key={row.slug}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  <span>{row.emoji}</span>
                  <span>{row.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
