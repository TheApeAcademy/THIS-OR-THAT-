"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export function ErrorScreen({
  title = "Something went wrong",
  message = "That didn't work. Your data is safe — try again.",
  onRetry,
  error,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  /** The error React caught — logged to the console so a recurrence is diagnosable client-side. */
  error?: (Error & { digest?: string }) | null;
}) {
  useEffect(() => {
    if (error) console.error("[ErrorScreen]", error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 px-8 text-center">
      <p className="text-xl font-semibold text-text-primary">{title}</p>
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
