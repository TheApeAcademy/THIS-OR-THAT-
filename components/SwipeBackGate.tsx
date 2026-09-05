"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

const EDGE_ZONE_PX = 24;
const BACK_THRESHOLD_PX = 80;
const DIRECTION_LOCK_PX = 10;

// Home renders FullScreenFeed, which already uses a full-width horizontal
// swipe as its vote gesture (see FeedSlide.tsx's onPan/onPanEnd) - an
// edge-swipe-back here would compete directly with that, so this gesture
// is disabled on Home entirely rather than trying to out-guess it.
const DISABLED_ROUTES = ["/home"];

export function SwipeBackGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Standalone-mode status doesn't change mid-session, so a one-time lazy
  // read is enough - no need for an effect/listener. Server render has no
  // `window`, so it safely defaults to false (gesture starts disabled) and
  // picks up the real value on the client's first render.
  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true
    );
  });
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const state = useRef<{ startX: number; startY: number; locked: "horizontal" | "vertical" | null } | null>(null);
  const dragXRef = useRef(0);

  const enabled = isStandalone && !DISABLED_ROUTES.includes(pathname);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX > EDGE_ZONE_PX) return;
      state.current = { startX: touch.clientX, startY: touch.clientY, locked: null };
    };

    const onTouchMove = (e: TouchEvent) => {
      const s = state.current;
      if (!s) return;
      const touch = e.touches[0];
      const dx = touch.clientX - s.startX;
      const dy = touch.clientY - s.startY;

      if (!s.locked) {
        if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return;
        s.locked = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
        if (s.locked === "horizontal") setDragging(true);
      }
      if (s.locked !== "horizontal") return;

      dragXRef.current = Math.max(0, dx);
      setDragX(dragXRef.current);
    };

    const onTouchEnd = () => {
      const s = state.current;
      state.current = null;
      if (s?.locked === "horizontal") {
        setDragging(false);
        if (dragXRef.current >= BACK_THRESHOLD_PX) {
          router.back();
        }
        dragXRef.current = 0;
        setDragX(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, router]);

  return (
    <div
      ref={wrapperRef}
      style={{
        transform: dragX ? `translateX(${dragX}px)` : undefined,
        transition: dragging ? undefined : "transform 0.2s ease",
        boxShadow: dragX ? "-12px 0 24px -12px rgba(0,0,0,0.35)" : undefined,
      }}
      className="h-full"
    >
      {children}
    </div>
  );
}
