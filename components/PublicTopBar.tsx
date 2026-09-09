import Link from "next/link";
import Image from "next/image";

/**
 * Persistent header for every unauthenticated/public route (/d/[id], /card/
 * [slug], /explore). Logo returns to the general public feed rather than "/"
 * (which just redirects to the auth-gated /home) - that's what makes "go
 * back to a general feed" actually reachable after landing on one piece of
 * shared content. `next` carries the current path through login/signup so a
 * visitor returns to what they were looking at instead of a generic /home.
 */
export function PublicTopBar({ next }: { next?: string }) {
  const suffix = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-1 flex items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-xl">
      <Link href="/explore" className="flex items-center gap-1.5">
        <Image src="/icons/icon-512.png" alt="" width={22} height={22} className="overflow-hidden rounded-[26%]" />
        <span className="text-sm font-bold tracking-tight text-text-primary">This or That</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href={`/login${suffix}`} className="tap-scale px-2 py-1.5 text-xs font-bold text-text-secondary">
          Log in
        </Link>
        <Link href={`/signup${suffix}`} className="tap-scale glass rounded-full px-3.5 py-1.5 text-xs font-bold text-accent">
          Sign up
        </Link>
      </div>
    </div>
  );
}
