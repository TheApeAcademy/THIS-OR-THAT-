"use client";

import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { ZodiacChip } from "@/components/ZodiacChip";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Confetti } from "@/components/ui/Confetti";
import { FlameIcon, TrophyIcon } from "@/components/ui/icons";
import { dismissAvatarUpgradePromptAction } from "@/lib/actions/avatar";
import { buzz, HAPTIC } from "@/lib/haptics";

const STREAK_MILESTONES = [7, 30, 100];

type FlameTier = "plain" | "bold" | "glow" | "epic";

function flameTier(streak: number): FlameTier {
  if (streak >= 100) return "epic";
  if (streak >= 30) return "glow";
  if (streak >= 7) return "bold";
  return "plain";
}

function StreakFlame({ tier }: { tier: FlameTier }) {
  if (tier === "plain") return <FlameIcon size={12} />;
  const size = tier === "bold" ? 14 : tier === "glow" ? 16 : 18;
  return (
    <motion.span
      className="inline-flex"
      animate={tier === "epic" ? { scale: [1, 1.18, 1] } : undefined}
      transition={tier === "epic" ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : undefined}
      style={tier !== "bold" ? { filter: "drop-shadow(0 0 4px rgba(255,255,255,0.9))" } : undefined}
    >
      <FlameIcon size={size} />
    </motion.span>
  );
}

const AvatarStudio = dynamic(() => import("@/components/AvatarStudio").then((m) => m.AvatarStudio), {
  ssr: false,
});

export function ProfileHero({
  username,
  displayName,
  photoUrl,
  avatarUrl,
  avatarModelUrl,
  hasUpgraded,
  upgradeDismissed,
  totalVotes,
  followerCount,
  currentStreak,
  longestStreak,
  streakFreezes = 0,
  birthdate = null,
  debateWinStreak = 0,
  verificationType = "none",
}: {
  username: string;
  displayName: string | null;
  photoUrl: string | null;
  avatarUrl: string | null;
  avatarModelUrl: string | null;
  hasUpgraded: boolean;
  upgradeDismissed: boolean;
  totalVotes: number;
  followerCount: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes?: number;
  birthdate?: string | null;
  /** Consecutive resolved (expired) debates this user backed the winning side of. */
  debateWinStreak?: number;
  verificationType?: "none" | "identity" | "social";
}) {
  const [studioOpen, setStudioOpen] = useState(false);
  const [optimisticAvatarModelUrl, setOptimisticAvatarModelUrl] = useState(avatarModelUrl);
  const [optimisticUpgraded, setOptimisticUpgraded] = useState(hasUpgraded);
  const [optimisticDismissed, setOptimisticDismissed] = useState(upgradeDismissed);
  const [isPending, startTransition] = useTransition();
  const [celebrateMilestone, setCelebrateMilestone] = useState<number | null>(null);

  useEffect(() => {
    const highest = STREAK_MILESTONES.filter((m) => currentStreak >= m).pop();
    if (!highest) return;
    const key = `streak-milestone-${username}`;
    let seen = 0;
    try {
      seen = Number(localStorage.getItem(key) ?? "0");
    } catch {
      return;
    }
    if (highest <= seen) return;
    try {
      localStorage.setItem(key, String(highest));
    } catch {
      // ignore - worst case the celebration replays next visit
    }
    const showTimeout = setTimeout(() => {
      setCelebrateMilestone(highest);
      buzz([...HAPTIC.success]);
    }, 0);
    const hideTimeout = setTimeout(() => setCelebrateMilestone(null), 1800);
    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, [currentStreak, username]);

  const dismiss = () => {
    setOptimisticDismissed(true);
    startTransition(async () => {
      await dismissAvatarUpgradePromptAction();
    });
  };

  const handleSaved = (modelUrl: string) => {
    setOptimisticAvatarModelUrl(modelUrl);
    setOptimisticUpgraded(true);
  };

  const showUpgradeBanner = !optimisticUpgraded && !optimisticDismissed;

  return (
    <div className="space-y-3">
      <div
        className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl p-6 text-center"
        style={{ background: "linear-gradient(180deg, var(--accent) 0%, var(--accent-2) 100%)" }}
      >
        <ProfilePhotoUpload username={username} photoUrl={photoUrl} size={104} />

        <div>
          <p className="flex items-center gap-1.5 text-xl font-bold text-white">
            {displayName || username}
            {verificationType !== "none" && <VerifiedBadge type={verificationType} />}
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <p className="text-sm font-medium text-white/70">@{username}</p>
            <ZodiacChip birthdate={birthdate} />
          </div>
        </div>

        <div className="flex gap-2">
          <HeroPillButton onClick={() => setStudioOpen(true)}>
            {optimisticUpgraded ? "View my avatar" : "Build my avatar"}
          </HeroPillButton>
          <Link href="/card">
            <HeroPillButton>View my Card</HeroPillButton>
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <StatChip>{totalVotes} votes</StatChip>
          <StatChip>{followerCount} followers</StatChip>
          {currentStreak > 0 && (
            <StatChip icon={<StreakFlame tier={flameTier(currentStreak)} />}>
              {currentStreak} day streak{longestStreak > currentStreak ? ` · best ${longestStreak}` : ""}
            </StatChip>
          )}
          {streakFreezes > 0 && <StatChip icon={<span>🧊</span>}>{streakFreezes}</StatChip>}
          {debateWinStreak > 1 && (
            <StatChip icon={<TrophyIcon size={12} />}>{debateWinStreak} debate win streak</StatChip>
          )}
        </div>

        <AnimatePresence>
          {celebrateMilestone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="relative flex items-center gap-2 rounded-full bg-black/60 px-5 py-2.5 backdrop-blur-sm">
                <Confetti count={16} radius={90} />
                <span className="text-2xl">🔥</span>
                <p className="text-sm font-black text-white">{celebrateMilestone}-day streak!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showUpgradeBanner && (
        <div className="glass flex gap-3 rounded-xl p-4">
          <div
            className="h-14 w-14 shrink-0 rounded-full"
            style={{ background: "linear-gradient(180deg, var(--accent) 0%, var(--accent-2) 100%)" }}
          />
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm font-semibold text-text-primary">Upgrade your avatar to 3D</p>
              <p className="text-xs text-text-secondary">
                Build a professional, fully-rendered 3D avatar - new hair, faces, and outfits.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setStudioOpen(true)}>
                Upgrade now
              </Button>
              <Button variant="ghost" size="sm" onClick={dismiss} disabled={isPending}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}

      {studioOpen && (
        <AvatarStudio
          avatarUrl={avatarUrl}
          avatarModelUrl={optimisticAvatarModelUrl}
          onSaved={handleSaved}
          onClose={() => setStudioOpen(false)}
        />
      )}
    </div>
  );
}

function HeroPillButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-scale flex h-9 items-center justify-center rounded-full bg-white/15 px-4 text-sm font-semibold text-white backdrop-blur-sm"
    >
      {children}
    </button>
  );
}

function StatChip({ children, icon, className }: { children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white",
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
