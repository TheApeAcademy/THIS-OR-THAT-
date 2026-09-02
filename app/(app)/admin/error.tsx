"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function Error({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen title="Couldn't load Moderation" message="Try again in a moment." error={error} onRetry={() => window.location.reload()} />
  );
}
