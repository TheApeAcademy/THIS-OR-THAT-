"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sheet } from "@/components/ui/Sheet";
import { toggleRepostAction } from "@/lib/actions/reposts";
import { buzz, HAPTIC } from "@/lib/haptics";

// TikTok-style: repost isn't its own button in the action rail, it's the
// top row of the same Share sheet everything else lives in.
export function ShareSheet({
  open,
  onClose,
  comparisonId,
  heading,
  initialReposted,
  initialRepostCount,
  loggedIn,
  onRequireLogin,
}: {
  open: boolean;
  onClose: () => void;
  comparisonId: string;
  heading: string;
  initialReposted: boolean;
  initialRepostCount: number;
  loggedIn: boolean;
  /** Called instead of reposting when the viewer isn't signed in. */
  onRequireLogin: () => void;
}) {
  const [reposted, setReposted] = useState(initialReposted);
  const [repostCount, setRepostCount] = useState(initialRepostCount);
  const [pending, setPending] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCanShare(typeof navigator !== "undefined" && "share" in navigator);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  const url = typeof window !== "undefined" ? `${window.location.origin}/comparison/${comparisonId}` : "";

  const toggleRepost = () => {
    if (!loggedIn) {
      onRequireLogin();
      return;
    }
    if (pending) return;
    const next = !reposted;
    setPending(true);
    buzz(next ? [...HAPTIC.success] : 8);
    setReposted(next);
    setRepostCount((c) => c + (next ? 1 : -1));
    toggleRepostAction(comparisonId, next)
      .catch(() => {
        setReposted(!next);
        setRepostCount((c) => c + (next ? -1 : 1));
      })
      .finally(() => setPending(false));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyLabel("Copied!");
      buzz(HAPTIC.tap);
      setTimeout(() => setCopyLabel("Copy link"), 1500);
    } catch {
      setCopyLabel("Couldn't copy");
      setTimeout(() => setCopyLabel("Copy link"), 1500);
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: heading, url });
    } catch {
      // user cancelled - no-op
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="space-y-1 pb-2">
        <button
          type="button"
          onClick={toggleRepost}
          className="tap-scale flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
          style={reposted ? { backgroundColor: "var(--accent-soft)" } : undefined}
        >
          <motion.span
            key={reposted ? "on" : "off"}
            initial={{ scale: 0.6, rotate: reposted ? -20 : 0 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="text-2xl"
          >
            🔁
          </motion.span>
          <div className="min-w-0 flex-1">
            <p className={reposted ? "font-bold text-accent" : "font-semibold text-text-primary"}>
              {reposted ? "Reposted" : "Repost"}
            </p>
            <p className="text-xs text-text-secondary">Share this to your followers&apos; feed</p>
          </div>
          {repostCount > 0 && <span className="text-sm font-bold text-text-secondary">{repostCount}</span>}
        </button>

        {canShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="tap-scale flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
          >
            <span className="text-2xl">📤</span>
            <p className="font-semibold text-text-primary">Share via…</p>
          </button>
        )}

        <button
          type="button"
          onClick={copyLink}
          className="tap-scale flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
        >
          <span className="text-2xl">🔗</span>
          <p className="font-semibold text-text-primary">{copyLabel}</p>
        </button>
      </div>
    </Sheet>
  );
}
