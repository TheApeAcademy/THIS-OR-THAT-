"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Avatar } from "@/components/ui/Avatar";

const HIDE_THRESHOLD_PX = 24;
const ICON_SIZE = 36;
const LOGO_SIZE = 80;

// The app-icon PNG has a solid dark rounded-square baked into the file
// (it's an actual home-screen icon export) - redrawn here as a plain
// transparent-background SVG of just the mark itself, since the header
// wants the logo floating free, not sitting in that square.
function TotLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <path d="M50 6a44 44 0 0 0 0 88Z" fill="#f4f4f6" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
      <path
        d="M50 6a44 44 0 0 1 0 88Z"
        fill="var(--accent)"
        stroke="#111111"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppHeader({ avatarUrl, username }: { avatarUrl: string | null; username: string }) {
  const [hidden, setHidden] = useState(false);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    // Scroll events don't bubble, but a capture-phase listener on document
    // still receives them from any nested scrollable descendant - which
    // matters here because FullScreenFeed (Home, /feed/[id]) has its own
    // inner scroll container rather than scrolling #app-scroll-container
    // directly. Reading event.target avoids having to know in advance
    // which element is the real scroll surface on a given route.
    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      const top = target instanceof Document ? document.documentElement.scrollTop : target.scrollTop;
      if (top <= HIDE_THRESHOLD_PX) {
        setHidden(false);
      } else if (top > lastScrollTop.current) {
        setHidden(true);
      } else if (top < lastScrollTop.current) {
        setHidden(false);
      }
      lastScrollTop.current = top;
    };

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  return (
    <header
      className={clsx(
        "glass-chrome fixed inset-x-0 top-0 z-30 flex h-11 items-center justify-between border-b border-border/60 px-4 transition-transform duration-300",
        hidden && "-translate-y-full"
      )}
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <Link href="/profile" data-tour="tab-profile" aria-label="Your profile">
        <Avatar name={username} src={avatarUrl} size={ICON_SIZE} />
      </Link>

      <Link
        href="/home"
        aria-label="This or That"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ marginTop: "calc(var(--safe-top) / 2)" }}
      >
        <TotLogo size={LOGO_SIZE} />
      </Link>

      <div style={{ height: ICON_SIZE, width: ICON_SIZE }} />
    </header>
  );
}
