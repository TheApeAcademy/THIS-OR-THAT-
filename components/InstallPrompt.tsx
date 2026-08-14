"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "tot-install-prompt-dismissed";

function isIOSSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint] = useState(() => !isStandalone() && isIOSSafari());
  const [dismissed, setDismissed] = useState(
    () => typeof window === "undefined" || localStorage.getItem(DISMISSED_KEY) === "1"
  );

  useEffect(() => {
    if (isStandalone()) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  if (dismissed || (!deferredPrompt && !showIOSHint)) return null;

  return (
    <div
      className="fixed inset-x-4 z-50 rounded-xl border border-border bg-surface-raised p-4 shadow-lg backdrop-blur-xl"
      style={{ bottom: "calc(var(--safe-bottom) + 88px)" }}
    >
      <p className="text-sm font-medium text-text-primary">
        Add This or That to your Home Screen
      </p>
      {deferredPrompt ? (
        <div className="mt-3 flex gap-2">
          <button
            className="tap-scale rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-contrast"
            onClick={async () => {
              await deferredPrompt.prompt();
              await deferredPrompt.userChoice;
              setDeferredPrompt(null);
              dismiss();
            }}
          >
            Install
          </button>
          <button
            className="tap-scale rounded-md px-3 py-1.5 text-sm text-text-secondary"
            onClick={dismiss}
          >
            Not now
          </button>
        </div>
      ) : (
        <p className="mt-1 text-sm text-text-secondary">
          Tap the Share icon, then &ldquo;Add to Home Screen&rdquo;.{" "}
          <button className="font-medium text-accent" onClick={dismiss}>
            Got it
          </button>
        </p>
      )}
    </div>
  );
}
