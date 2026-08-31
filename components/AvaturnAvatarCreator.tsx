"use client";

import { useEffect, useRef, useState } from "react";
import { AvaturnSDK, type ExportAvatarResult } from "@avaturn/sdk";
import { saveExportedAvatar } from "@/lib/avatarUpload";

const AVATURN_SUBDOMAIN = process.env.NEXT_PUBLIC_AVATURN_SUBDOMAIN;

const containerClassName: Record<"sheet" | "inline" | "fullscreen", string> = {
  fullscreen: "relative h-full w-full overflow-hidden",
  sheet: "relative h-[70vh] w-full overflow-hidden rounded-lg",
  inline: "relative h-[420px] w-full overflow-hidden rounded-xl border border-border",
};

export function AvaturnAvatarCreator({
  variant,
  onSaved,
}: {
  variant: "sheet" | "inline" | "fullscreen";
  onSaved: (modelUrl: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSavedRef = useRef(onSaved);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading");

  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  useEffect(() => {
    if (!AVATURN_SUBDOMAIN || !containerRef.current) return;

    let cancelled = false;
    const sdk = new AvaturnSDK();

    sdk
      .init(containerRef.current, { url: `https://${AVATURN_SUBDOMAIN}.avaturn.me/` })
      .then(() => {
        if (cancelled) return;
        setStatus("ready");
        sdk.on("export", (result: ExportAvatarResult) => {
          setStatus("saving");
          saveExportedAvatar(result)
            .then((modelUrl) => {
              if (!cancelled) onSavedRef.current(modelUrl);
            })
            .catch(() => {
              if (!cancelled) setStatus("error");
            });
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      sdk.destroy();
    };
  }, []);

  if (!AVATURN_SUBDOMAIN) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-secondary">
        3D avatar creation isn&apos;t configured yet — missing NEXT_PUBLIC_AVATURN_SUBDOMAIN.
      </div>
    );
  }

  return (
    <div className={containerClassName[variant]}>
      <div ref={containerRef} className="h-full w-full" />
      {(status === "loading" || status === "saving" || status === "error") && (
        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-2 text-center text-sm font-semibold text-white">
          {status === "loading" && "Loading avatar creator…"}
          {status === "saving" && "Saving your avatar…"}
          {status === "error" && "Something went wrong — try again."}
        </div>
      )}
    </div>
  );
}
