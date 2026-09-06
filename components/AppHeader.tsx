"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { TrophyIcon, SearchIcon, PlusIcon } from "@/components/ui/icons";
import { formatCount } from "@/lib/formatCount";

const HIDE_THRESHOLD_PX = 24;

export function AppHeader({
  reputation,
  avatarUrl,
  username,
}: {
  reputation: number;
  avatarUrl: string | null;
  username: string;
}) {
  const [hidden, setHidden] = useState(false);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const el = document.getElementById("app-scroll-container");
    if (!el) return;

    const onScroll = () => {
      const top = el.scrollTop;
      if (top <= HIDE_THRESHOLD_PX) {
        setHidden(false);
      } else if (top > lastScrollTop.current) {
        setHidden(true);
      } else if (top < lastScrollTop.current) {
        setHidden(false);
      }
      lastScrollTop.current = top;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "glass-chrome fixed inset-x-0 top-0 z-30 flex h-11 items-center justify-between border-b border-border/60 px-4 transition-transform duration-300",
        hidden && "-translate-y-full"
      )}
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <Link
        href="/profile"
        className="tap-scale flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-text-secondary"
        aria-label={`${reputation} points`}
      >
        <TrophyIcon size={14} className="text-accent" />
        {formatCount(reputation)}
      </Link>

      <Link href="/home" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ marginTop: "calc(var(--safe-top) / 2)" }}>
        <Image
          src="/icons/icon-512.png"
          alt="This or That"
          width={32}
          height={32}
          className="overflow-hidden rounded-[26%] shadow-[0_2px_14px_-2px_var(--accent)]"
        />
      </Link>

      <div className="flex items-center gap-3">
        <Link href="/search" aria-label="Search" className="tap-scale flex h-9 w-9 items-center justify-center text-text-primary">
          <SearchIcon size={22} />
        </Link>
        <Link
          href="/create"
          data-tour="tab-create"
          aria-label="Create"
          className="tap-scale flex h-9 w-9 items-center justify-center text-text-primary"
        >
          <PlusIcon size={22} />
        </Link>
        <Link href="/profile" data-tour="tab-profile" aria-label="Your profile">
          <Avatar name={username} src={avatarUrl} size={28} />
        </Link>
      </div>
    </header>
  );
}
