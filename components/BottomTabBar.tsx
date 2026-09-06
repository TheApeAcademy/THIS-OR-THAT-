"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { buzz, HAPTIC } from "@/lib/haptics";

const TABS = [
  { href: "/home", icon: HomeIcon },
  { href: "/play", icon: PlayIcon },
  { href: "/notifications", icon: NotificationsIcon },
  { href: "/search", icon: SearchTabIcon },
];

function CreateIcon({ active }: { active: boolean }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke={iconColor(active)}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Telegram's own bottom bar, matched exactly: a dark rounded "island"
// pill holding the main tabs close together, plus a separate small
// circular satellite right next to it - same background/height, small
// gap - for Create, the one action that isn't a destination tab.
export function BottomTabBar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  const tab = (href: string, Icon: (props: { active: boolean }) => React.JSX.Element, size = "h-11 w-11") => {
    const active = pathname?.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        data-tour={`tab-${href.slice(1)}`}
        onClick={() => !active && buzz(HAPTIC.tap)}
        aria-label={href.slice(1)}
        className={clsx(
          "tap-scale relative flex items-center justify-center rounded-full",
          active && "bg-white/10",
          size
        )}
      >
        <Icon active={!!active} />
        {href === "/notifications" && unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-danger" />
        )}
      </Link>
    );
  };

  return (
    <div
      className="fixed inset-x-0 z-30 flex items-center justify-center gap-2.5"
      style={{ bottom: "calc(var(--safe-bottom) + 14px)" }}
    >
      <nav className="glass-chrome flex items-center gap-1 rounded-[28px] px-2 py-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
        {TABS.map(({ href, icon }) => tab(href, icon))}
      </nav>
      <div className="glass-chrome flex h-14 w-14 items-center justify-center rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
        {tab("/create", CreateIcon, "h-full w-full")}
      </div>
    </div>
  );
}

function iconColor(active: boolean) {
  return active ? "var(--accent)" : "var(--text-secondary)";
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-9"
        stroke={iconColor(active)}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
    </svg>
  );
}

function PlayIcon({ active }: { active: boolean }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4.5v15l13-7.5-13-7.5Z"
        stroke={iconColor(active)}
        strokeWidth="2.6"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
    </svg>
  );
}

function NotificationsIcon({ active }: { active: boolean }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9.5a6 6 0 0 1 12 0c0 3.4 1.1 5 1.8 5.8H4.2C4.9 14.5 6 12.9 6 9.5Z"
        stroke={iconColor(active)}
        strokeWidth="2.6"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
      <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" stroke={iconColor(active)} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function SearchTabIcon({ active }: { active: boolean }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <circle cx="10.5" cy="10.5" r="6.5" stroke={iconColor(active)} strokeWidth="2.6" />
      <path d="m19.3 19.3-4.4-4.4" stroke={iconColor(active)} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
