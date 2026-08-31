"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { dismissAvatarUpgradePromptAction } from "@/lib/actions/avatar";

const RpmAvatarCreator = dynamic(
  () => import("@/components/RpmAvatarCreator").then((m) => m.RpmAvatarCreator),
  { ssr: false }
);
const Avatar3DViewer = dynamic(
  () => import("@/components/Avatar3DViewer").then((m) => m.Avatar3DViewer),
  { ssr: false }
);

export function AvatarSection({
  avatarModelUrl,
  hasUpgraded,
  upgradeDismissed,
}: {
  avatarModelUrl: string | null;
  hasUpgraded: boolean;
  upgradeDismissed: boolean;
}) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [optimisticUpgraded, setOptimisticUpgraded] = useState(hasUpgraded);
  const [optimisticDismissed, setOptimisticDismissed] = useState(upgradeDismissed);
  const [isPending, startTransition] = useTransition();

  const dismiss = () => {
    setOptimisticDismissed(true);
    startTransition(async () => {
      await dismissAvatarUpgradePromptAction();
    });
  };

  const handleSaved = () => {
    setOptimisticUpgraded(true);
    setTimeout(() => setBuilderOpen(false), 800);
  };

  const showUpgradeBanner = !optimisticUpgraded && !optimisticDismissed;

  return (
    <div className="space-y-3">
      {showUpgradeBanner && (
        <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-sm font-semibold text-text-primary">Upgrade your avatar to 3D</p>
          <p className="text-xs text-text-secondary">
            Build a professional, fully-rendered 3D avatar — new hair, faces, and outfits.
          </p>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1" size="sm" onClick={() => setBuilderOpen(true)}>
              Upgrade now
            </Button>
            <Button variant="secondary" size="sm" onClick={dismiss} disabled={isPending}>
              Not now
            </Button>
          </div>
        </div>
      )}

      <Button variant="secondary" className="w-full" onClick={() => setBuilderOpen(true)}>
        {optimisticUpgraded ? "Edit my 3D avatar" : "Build my avatar"}
      </Button>

      {avatarModelUrl && (
        <Button variant="ghost" className="w-full" onClick={() => setViewerOpen(true)}>
          View in 3D ✨
        </Button>
      )}

      <Sheet open={builderOpen} onClose={() => setBuilderOpen(false)}>
        <RpmAvatarCreator variant="sheet" onSaved={handleSaved} />
      </Sheet>

      <Sheet open={viewerOpen} onClose={() => setViewerOpen(false)}>
        {avatarModelUrl && <Avatar3DViewer url={avatarModelUrl} className="h-[50vh] w-full" />}
      </Sheet>
    </div>
  );
}
