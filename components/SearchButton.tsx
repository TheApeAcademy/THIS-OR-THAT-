import Link from "next/link";

export function SearchButton() {
  return (
    <Link
      href="/search"
      aria-label="Search"
      className="tap-scale glass fixed right-[60px] z-20 flex h-11 w-11 items-center justify-center rounded-full"
      style={{ top: "calc(var(--safe-top) + 12px)" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="var(--text-primary)" strokeWidth="2" />
        <path d="m20 20-4-4" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
