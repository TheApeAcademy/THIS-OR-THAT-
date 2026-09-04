"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      title="Couldn't load your saved debates"
      message="Check your connection and try again."
      onRetry={reset}
    />
  );
}
