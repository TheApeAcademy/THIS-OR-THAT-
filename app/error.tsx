"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <ErrorScreen error={error} onRetry={() => window.location.reload()} />
    </div>
  );
}
