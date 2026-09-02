"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function Error({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen title="Couldn't load this rank" message="Check your connection and try again." error={error} onRetry={() => window.location.reload()} />
  );
}
