"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { reportContentAction, type ReportReason, type ReportTargetType } from "@/lib/actions/reports";
import { buzz, HAPTIC } from "@/lib/haptics";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Something else" },
];

export function ReportButton({
  targetType,
  targetId,
  className,
}: {
  targetType: ReportTargetType;
  targetId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = (reason: ReportReason) => {
    startTransition(async () => {
      try {
        await reportContentAction(targetType, targetId, reason);
      } catch {
        // Best-effort — still close the sheet with a thank-you so the flow
        // never feels broken even if e.g. the user isn't authenticated.
      }
      buzz(HAPTIC.confirm);
      setDone(true);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "tap-scale text-xs text-text-secondary"}
        aria-label="Report"
      >
        Report
      </button>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          setDone(false);
        }}
      >
        {done ? (
          <div className="space-y-3 py-4 text-center">
            <p className="font-semibold text-text-primary">Thanks for the report.</p>
            <p className="text-sm text-text-secondary">Our team will take a look.</p>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="font-semibold text-text-primary">Why are you reporting this?</p>
            {REASONS.map((r) => (
              <button
                key={r.value}
                disabled={isPending}
                onClick={() => submit(r.value)}
                className="tap-scale block w-full rounded-lg border border-border px-4 py-3 text-left text-sm text-text-primary disabled:opacity-40"
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </Sheet>
    </>
  );
}
