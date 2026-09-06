"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buzz, HAPTIC } from "@/lib/haptics";

const MAIN_TABS = [
  { href: "/home", icon: HomeIcon },
  { href: "/play", icon: PlayIcon },
  { href: "/discover", icon: DiscoverIcon },
];

// Telegram's own bottom bar, copied exactly: a dark rounded "island"
// holding the main destinations, plus a separate circular button right
// next to it for search - same background/height as the island, close
// enough to read as one connected assembly, but not merged into one shape.
export function BottomTabBar() {
  const pathname = usePathname();

  const tabButton = (href: string, Icon: (props: { active: boolean }) => React.JSX.Element) => {
    const active = pathname?.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        data-tour={`tab-${href.slice(1)}`}
        onClick={() => !active && buzz(HAPTIC.tap)}
        aria-label={href.slice(1)}
        className="tap-scale flex h-11 w-11 items-center justify-center"
      >
        <Icon active={!!active} />
      </Link>
    );
  };

  return (
    <div
      className="fixed inset-x-0 z-30 flex items-center justify-center gap-2.5"
      style={{ bottom: "calc(var(--safe-bottom) + 14px)" }}
    >
      <nav className="glass-chrome flex items-center gap-1 rounded-[26px] px-2 py-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
        {MAIN_TABS.map(({ href, icon }) => tabButton(href, icon))}
      </nav>
      <div className="glass-chrome flex h-14 w-14 items-center justify-center rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
        {tabButton("/search", SearchTabIcon)}
      </div>
    </div>
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
        strokeWidth="2.8"
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
        strokeWidth="2.8"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
    </svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke={iconColor(active)} strokeWidth="2.8" />
      <path
        d="m14.5 9.5-1.8 4.7a1 1 0 0 1-.5.5L7.5 16.5l1.8-4.7a1 1 0 0 1 .5-.5Z"
        stroke={iconColor(active)}
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
    </svg>
  );
}

function SearchTabIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="10.5" cy="10.5" r="6.1" stroke={iconColor(active)} strokeWidth="2.8" />
      <path d="m19.3 19.3-4.2-4.2" stroke={iconColor(active)} strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
