import Link from "next/link";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/activity"
      aria-label={unreadCount > 0 ? `Activity, ${unreadCount} unread` : "Activity"}
      className="tap-scale glass fixed right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full"
      style={{ top: "calc(var(--safe-top) + 12px)" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z"
          stroke="var(--text-primary)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 19.5a2.5 2.5 0 0 0 5 0"
          stroke="var(--text-primary)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
