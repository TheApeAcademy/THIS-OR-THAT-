"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { PlusIcon } from "@/components/ui/icons";

const HIDE_THRESHOLD_PX = 24;
const ICON_SIZE = 26;

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
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ marginTop: "calc(var(--safe-top) / 2)" }}
      >
        <Image
          src="/icons/icon-512.png"
          alt="This or That"
          width={40}
          height={40}
          className="overflow-hidden rounded-[26%] shadow-[0_2px_16px_-2px_var(--accent)]"
        />
      </Link>

      <Link
        href="/create"
        data-tour="tab-create"
        aria-label="Create"
        className="tap-scale flex items-center justify-center text-text-primary"
        style={{ height: ICON_SIZE, width: ICON_SIZE }}
      >
        <PlusIcon size={ICON_SIZE} />
      </Link>
    </header>
  );
}
