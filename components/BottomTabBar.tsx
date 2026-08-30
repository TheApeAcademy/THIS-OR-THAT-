"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const TABS = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/play", label: "Play", icon: PlayIcon },
  { href: "/discover", label: "Discover", icon: DiscoverIcon },
  { href: "/create", label: "Create", icon: CreateIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/70 backdrop-blur-xl"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="tap-scale flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <Icon active={!!active} />
              <span
                className={clsx(
                  "text-[11px] font-medium",
                  active ? "text-accent" : "text-text-secondary"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeWidth="2"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
    </svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke={iconColor(active)} strokeWidth="2" />
      <path
        d="m14.5 9.5-1.8 4.7a1 1 0 0 1-.5.5L7.5 16.5l1.8-4.7a1 1 0 0 1 .5-.5Z"
        stroke={iconColor(active)}
        strokeWidth="2"
        strokeLinejoin="round"
        fill={active ? iconColor(active) : "none"}
      />
    </svg>
  );
}

function CreateIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={iconColor(active)} strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke={iconColor(active)} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke={iconColor(active)} strokeWidth="2" />
      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke={iconColor(active)}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
