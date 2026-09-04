"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const STORAGE_PREFIX = "tot:scroll:";
const SAVE_DEBOUNCE_MS = 150;

/**
 * Wraps the app's single persistent scroll container (this layout doesn't
 * remount between route changes within the (app) group) and remembers
 * each route's scroll offset in sessionStorage, so going feed -> detail ->
 * back lands where you left off instead of snapping to the top.
 */
export function ScrollRestoration({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    try {
      const saved = sessionStorage.getItem(STORAGE_PREFIX + pathname);
      el.scrollTop = saved ? Number(saved) : 0;
    } catch {
      el.scrollTop = 0;
    }

    const onScroll = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          sessionStorage.setItem(STORAGE_PREFIX + pathname, String(el.scrollTop));
        } catch {
          // ignore — best-effort only
        }
      }, SAVE_DEBOUNCE_MS);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [pathname]);

  return (
    <main
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      style={{
        paddingTop: "var(--safe-top)",
        paddingBottom: "calc(var(--safe-bottom) + 64px)",
      }}
    >
      {children}
    </main>
  );
}
