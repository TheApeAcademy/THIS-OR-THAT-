"use client";

import { useEffect } from "react";

// A broken/poisoned chunk (stale SW cache, or a client caught mid-deploy)
// can't be fixed by React re-rendering — only a real network refetch heals
// it. This reloads at most once per tab so a genuinely broken deploy can't
// loop forever.
const RELOAD_GUARD_KEY = "tot-recovered";

function reloadOnce() {
  try {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
  } catch {
    // sessionStorage unavailable — reload anyway, worst case is one retry
  }
  window.location.reload();
}

const CHUNK_ERROR_PATTERN = /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module|error loading dynamically imported module/i;

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability degrades gracefully if registration fails.
      });

      // Fires when a newly-activated SW (skipWaiting + clients.claim) takes
      // over this already-open tab — reload so any script that already
      // resolved against the old (possibly poisoned) worker gets refetched.
      navigator.serviceWorker.addEventListener("controllerchange", reloadOnce);
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message ?? String(event.reason ?? "");
      if (CHUNK_ERROR_PATTERN.test(message)) reloadOnce();
    };
    const handleError = (event: ErrorEvent) => {
      if (CHUNK_ERROR_PATTERN.test(event.message ?? "")) reloadOnce();
    };
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);

    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", reloadOnce);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
