"use client";

import Link from "next/link";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      data-tour="notifications"
      className="tap-scale relative flex h-9 w-9 items-center justify-center rounded-full"
    >
      <BellIcon />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 10a6 6 0 1 1 12 0c0 3.2 1 5 1.8 6H4.2C5 15 6 13.2 6 10Z"
        stroke="var(--text-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
