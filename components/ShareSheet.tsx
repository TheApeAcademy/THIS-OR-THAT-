"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sheet } from "@/components/ui/Sheet";
import { toggleRepostAction } from "@/lib/actions/reposts";
import { buzz, HAPTIC } from "@/lib/haptics";

// TikTok-style: repost isn't its own button in the action rail, it's the
// top row of the same Share sheet everything else lives in.
function withSource(url: string, source: string): string {
  if (!url) return url;
  return `${url}${url.includes("?") ? "&" : "?"}source=${source}`;
}

export function ShareSheet({
  open,
  onClose,
  comparisonId,
  heading,
  initialReposted,
  initialRepostCount,
  loggedIn,
  onRequireLogin,
  shareUrl,
  caption,
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
  /** Overrides the default /comparison/[id] link - e.g. the public /d/[id] link for external sharing. */
  shareUrl?: string;
  /** Overrides the default heading-only caption used for platform share text. */
  caption?: string;
}) {
  const [reposted, setReposted] = useState(initialReposted);
  const [repostCount, setRepostCount] = useState(initialRepostCount);
  const [pending, setPending] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const [canShare, setCanShare] = useState(false);
  const [igLabel, setIgLabel] = useState("Instagram");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCanShare(typeof navigator !== "undefined" && "share" in navigator);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  // Defaults to the public /d/[id] link, not /comparison/[id] - the latter
  // is auth-gated, so a recipient without an account would just hit a
  // login wall instead of seeing the debate.
  const url = shareUrl ?? (typeof window !== "undefined" ? `${window.location.origin}/d/${comparisonId}` : "");
  const text = caption ?? heading;

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

  const openLink = (href: string) => {
    buzz(HAPTIC.tap);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const shareToWhatsapp = () =>
    openLink(`https://wa.me/?text=${encodeURIComponent(`${text} ${withSource(url, "whatsapp")}`)}`);

  const shareToTelegram = () =>
    openLink(
      `https://t.me/share/url?url=${encodeURIComponent(withSource(url, "telegram"))}&text=${encodeURIComponent(text)}`
    );

  const shareToX = () =>
    openLink(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(withSource(url, "x"))}`
    );

  // Instagram has no direct-post URL scheme (Meta's Graph API requires app
  // review for that) - the honest graceful-degrade is handing the caption +
  // link to the native OS share sheet (Instagram shows up there on mobile),
  // and falling back to "copy it yourself" where no native sheet exists.
  const shareToInstagram = async () => {
    const igUrl = withSource(url, "instagram");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: heading, text, url: igUrl });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${igUrl}`);
      setIgLabel("Copied - paste in Instagram");
      buzz(HAPTIC.tap);
      setTimeout(() => setIgLabel("Instagram"), 2000);
    } catch {
      setIgLabel("Couldn't copy");
      setTimeout(() => setIgLabel("Instagram"), 2000);
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
          onClick={shareToWhatsapp}
          className="tap-scale flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
        >
          <span className="text-2xl">💬</span>
          <p className="font-semibold text-text-primary">WhatsApp</p>
        </button>

        <button
          type="button"
          onClick={shareToTelegram}
          className="tap-scale flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
        >
          <span className="text-2xl">✈️</span>
          <p className="font-semibold text-text-primary">Telegram</p>
        </button>

        <button
          type="button"
          onClick={shareToX}
          className="tap-scale flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
        >
          <span className="text-2xl">𝕏</span>
          <p className="font-semibold text-text-primary">X</p>
        </button>

        <button
          type="button"
          onClick={shareToInstagram}
          className="tap-scale flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
        >
          <span className="text-2xl">📸</span>
          <p className="font-semibold text-text-primary">{igLabel}</p>
        </button>

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
