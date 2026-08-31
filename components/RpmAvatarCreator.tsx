"use client";

import { useState, useTransition } from "react";
import { AvatarCreator, type AvatarExportedEvent } from "@readyplayerme/react-avatar-creator";
import { updateAvatar3DAction } from "@/lib/actions/avatar";

const RPM_SUBDOMAIN = process.env.NEXT_PUBLIC_RPM_SUBDOMAIN;

export function RpmAvatarCreator({
  variant,
  onSaved,
  existingAvatarId,
}: {
  variant: "sheet" | "inline";
  onSaved: (modelUrl: string) => void;
  existingAvatarId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!RPM_SUBDOMAIN) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-secondary">
        3D avatar creation isn&apos;t configured yet — missing NEXT_PUBLIC_RPM_SUBDOMAIN.
      </div>
    );
  }

  const handleExported = (event: AvatarExportedEvent) => {
    const { url, avatarId } = event.data;
    setError(null);
    startTransition(async () => {
      try {
        await updateAvatar3DAction(url, avatarId);
        onSaved(url);
      } catch {
        setError("Couldn't save your avatar — try again.");
      }
    });
  };

  return (
    <div
      className={
        variant === "sheet"
          ? "relative h-[70vh] w-full overflow-hidden rounded-lg"
          : "relative h-[420px] w-full overflow-hidden rounded-xl border border-border"
      }
    >
      <AvatarCreator
        subdomain={RPM_SUBDOMAIN}
        style={{ width: "100%", height: "100%", border: "none" }}
        config={{
          clearCache: true,
          bodyType: "fullbody",
          quickStart: false,
          language: "en",
          avatarId: existingAvatarId,
        }}
        onAvatarExported={handleExported}
      />
      {(isPending || error) && (
        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-2 text-center text-sm font-semibold text-white">
          {isPending ? "Saving your avatar…" : error}
        </div>
      )}
    </div>
  );
}
