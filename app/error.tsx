"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <ErrorScreen onRetry={reset} />
    </div>
  );
}
