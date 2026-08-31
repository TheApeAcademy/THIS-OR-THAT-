"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { dismissAvatarUpgradePromptAction } from "@/lib/actions/avatar";

const AvatarStudio = dynamic(() => import("@/components/AvatarStudio").then((m) => m.AvatarStudio), {
  ssr: false,
});

export function AvatarSection({
  avatarUrl,
  avatarModelUrl,
  hasUpgraded,
  upgradeDismissed,
}: {
  avatarUrl: string | null;
  avatarModelUrl: string | null;
  hasUpgraded: boolean;
  upgradeDismissed: boolean;
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

      <Button variant="secondary" className="w-full" onClick={() => setStudioOpen(true)}>
        {optimisticUpgraded ? "View my 3D avatar" : "Build my avatar"}
      </Button>

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
