"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { ZodiacChip } from "@/components/ZodiacChip";
import { FlameIcon } from "@/components/ui/icons";
import { dismissAvatarUpgradePromptAction } from "@/lib/actions/avatar";

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
  birthdate = null,
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
  birthdate?: string | null;
}) {
  const [studioOpen, setStudioOpen] = useState(false);
  const [optimisticAvatarModelUrl, setOptimisticAvatarModelUrl] = useState(avatarModelUrl);
  const [optimisticUpgraded, setOptimisticUpgraded] = useState(hasUpgraded);
  const [optimisticDismissed, setOptimisticDismissed] = useState(upgradeDismissed);
  const [isPending, startTransition] = useTransition();

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
        className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
        style={{ background: "linear-gradient(180deg, var(--accent) 0%, var(--accent-2) 100%)" }}
      >
        <ProfilePhotoUpload username={username} photoUrl={photoUrl} size={104} />

        <div>
          <p className="text-xl font-bold text-white">{displayName || username}</p>
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
            <StatChip icon={<FlameIcon size={12} />}>
              {currentStreak} day streak{longestStreak > currentStreak ? ` · best ${longestStreak}` : ""}
            </StatChip>
          )}
        </div>
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
                Build a professional, fully-rendered 3D avatar — new hair, faces, and outfits.
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
