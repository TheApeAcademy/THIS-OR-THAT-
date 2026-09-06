"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buzz, HAPTIC } from "@/lib/haptics";

const TABS = [
  { href: "/home", icon: HomeIcon },
  { href: "/play", icon: PlayIcon },
  { href: "/discover", icon: DiscoverIcon },
  { href: "/search", icon: SearchTabIcon },
];

// Bare, floating icons directly over the content - no glass/pill panel
// behind them, matching Instagram/TikTok's own bottom bar: long (spans
// the full width, icons spread out) and slim (small icons, tight tap
// targets, no extra vertical padding) rather than a clustered clump.
// A drop-shadow on each icon keeps it legible over bright feed images
// without needing a background panel.
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 z-30 mx-auto flex max-w-md items-center justify-around px-8"
      style={{ bottom: "calc(var(--safe-bottom) + 10px)" }}
    >
      {TABS.map(({ href, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            data-tour={`tab-${href.slice(1)}`}
            onClick={() => !active && buzz(HAPTIC.tap)}
            aria-label={href.slice(1)}
            className="tap-scale flex h-8 w-8 items-center justify-center drop-shadow-[0_1px_5px_rgba(0,0,0,0.55)]"
          >
            <Icon active={!!active} />
          </Link>
        );
      })}
    </nav>
  );
}

function iconColor(active: boolean) {
  return active ? "var(--accent)" : "var(--text-secondary)";
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-9"
        stroke={iconColor(active)}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "var(--accent-soft)" : "none"}
      />
    </svg>
  );
}

function PlayIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4.5v15l13-7.5-13-7.5Z"
        stroke={iconColor(active)}
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
    </svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.2" stroke={iconColor(active)} strokeWidth="2.2" />
      <path
        d="m14.5 9.5-1.8 4.7a1 1 0 0 1-.5.5L7.5 16.5l1.8-4.7a1 1 0 0 1 .5-.5Z"
        stroke={iconColor(active)}
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
    </svg>
  );
}

function SearchTabIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="10.5" cy="10.5" r="6.3" stroke={iconColor(active)} strokeWidth="2.2" />
      <path d="m19.3 19.3-4.2-4.2" stroke={iconColor(active)} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
