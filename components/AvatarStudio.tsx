"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { UpgradeProButton } from "@/components/UpgradeProButton";
import type { DicebearChoice } from "@/components/DicebearAvatarBuilder";

const AvaturnAvatarCreator = dynamic(
  () => import("@/components/AvaturnAvatarCreator").then((m) => m.AvaturnAvatarCreator),
  { ssr: false }
);
const Avatar3DViewer = dynamic(
  () => import("@/components/Avatar3DViewer").then((m) => m.Avatar3DViewer),
  { ssr: false }
);
const DicebearAvatarBuilder = dynamic(
  () => import("@/components/DicebearAvatarBuilder").then((m) => m.DicebearAvatarBuilder),
  { ssr: false }
);

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6 6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15V4m0 0 4 4m-4-4-4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TopBarButton({
  onClick,
  children,
  square = false,
  filled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  square?: boolean;
  filled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "tap-scale flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-semibold backdrop-blur-sm",
        square ? "w-10" : "px-3.5",
        filled ? "bg-white text-accent" : "bg-white/15 text-white"
      )}
    >
      {children}
    </button>
  );
}

export function AvatarStudio({
  avatarUrl,
  avatarModelUrl,
  isPro,
  userId,
  userEmail,
  dicebearOptions,
  onSaved,
  onDicebearSaved,
  onClose,
}: {
  avatarUrl: string | null;
  avatarModelUrl: string | null;
  isPro: boolean;
  userId: string;
  userEmail: string;
  dicebearOptions?: Partial<DicebearChoice> | null;
  onSaved: (modelUrl: string) => void;
  onDicebearSaved: (avatarUrl: string) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const handleSaved = (modelUrl: string) => {
    onSaved(modelUrl);
    setEditing(false);
  };

  const handleDicebearSaved = (newAvatarUrl: string) => {
    onDicebearSaved(newAvatarUrl);
    setEditing(false);
  };

  const share = async () => {
    if (!avatarUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ url: avatarUrl, title: "My 3D avatar" });
      } else {
        await navigator.clipboard.writeText(avatarUrl);
      }
    } catch {
      // user cancelled the share sheet - not an error
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "linear-gradient(180deg, var(--accent) 0%, var(--accent-2) 100%)" }}
    >
      <div
        className="flex items-center justify-between px-4 pb-3"
        style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}
      >
        <TopBarButton onClick={onClose} square>
          <CloseIcon />
        </TopBarButton>

        <div className="flex gap-2">
          {avatarUrl && !editing && (
            <TopBarButton onClick={share}>
              <ShareIcon />
              Share
            </TopBarButton>
          )}
          {!editing && (
            <TopBarButton onClick={() => setEditing(true)} filled>
              Edit
            </TopBarButton>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {editing ? (
          isPro ? (
            <AvaturnAvatarCreator variant="fullscreen" onSaved={handleSaved} />
          ) : (
            <DicebearAvatarBuilder variant="fullscreen" initialOptions={dicebearOptions} onSaved={handleDicebearSaved} />
          )
        ) : isPro && avatarModelUrl ? (
          <Avatar3DViewer url={avatarModelUrl} className="h-full w-full" />
        ) : avatarUrl ? (
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="Your avatar" className="h-56 w-56 rounded-full bg-white/10" />
          </div>
        ) : null}
      </div>

      {!editing && !isPro && (
        <div
          className="flex flex-col items-center gap-3 px-6 text-center"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
        >
          <p className="text-sm font-medium text-white/90">Want a fully-rendered, standing 3D avatar?</p>
          <UpgradeProButton userId={userId} userEmail={userEmail} label="Unlock 3D avatar" />
        </div>
      )}

      {!editing && isPro && !avatarModelUrl && (
        <div
          className="flex flex-col items-center gap-3 px-6 pb-10 text-center"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
        >
          <p className="text-sm font-medium text-white/90">You haven&apos;t built a 3D avatar yet.</p>
          <Button onClick={() => setEditing(true)}>Create your 3D avatar</Button>
        </div>
      )}
    </div>
  );
}
