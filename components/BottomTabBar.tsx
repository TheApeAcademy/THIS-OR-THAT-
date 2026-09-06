"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buzz, HAPTIC } from "@/lib/haptics";

const TABS = [
  { href: "/home", icon: HomeIcon },
  { href: "/play", icon: PlayIcon },
  { href: "/discover", icon: DiscoverIcon },
];

// A small, centered, icon-only glass pill - Instagram's own bottom bar is
// one flat row of same-size icons with no labels and no elevated/raised
// button, so this matches that rather than a bulkier full-width bar.
// Create and Profile moved up into the header (AppHeader.tsx) to keep this
// pill genuinely small.
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center"
      style={{ bottom: "calc(var(--safe-bottom) + 14px)" }}
    >
      <nav className="glass-chrome flex items-center gap-1 rounded-full px-2 py-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
        {TABS.map(({ href, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              data-tour={`tab-${href.slice(1)}`}
              onClick={() => !active && buzz(HAPTIC.tap)}
              aria-label={href.slice(1)}
              className="tap-scale flex h-11 w-11 items-center justify-center rounded-full"
            >
              <Icon active={!!active} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function iconColor(active: boolean) {
  return active ? "var(--accent)" : "var(--text-secondary)";
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-9"
        stroke={iconColor(active)}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "var(--accent-soft)" : "none"}
      />
    </svg>
  );
}

function PlayIcon({ active }: { active: boolean }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4.5v15l13-7.5-13-7.5Z"
        stroke={iconColor(active)}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
    </svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.2" stroke={iconColor(active)} strokeWidth="1.8" />
      <path
        d="m14.5 9.5-1.8 4.7a1 1 0 0 1-.5.5L7.5 16.5l1.8-4.7a1 1 0 0 1 .5-.5Z"
        stroke={iconColor(active)}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
    </svg>
  );
}
