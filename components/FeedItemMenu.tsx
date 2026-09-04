"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { dismissFeedItemAction } from "@/lib/actions/feed";
import { toggleBlockAction, toggleMuteAction } from "@/lib/actions/blocks";
import { reportContentAction, type ReportReason } from "@/lib/actions/reports";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Something else" },
];

export function FeedItemMenu({
  comparisonId,
  author,
  onDismiss,
}: {
  comparisonId: string;
  author?: { id: string; username: string };
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"menu" | "report" | "done">("menu");
  const [, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setTimeout(() => setStep("menu"), 200);
  };

  const notInterested = () => {
    close();
    onDismiss();
    startTransition(() => {
      dismissFeedItemAction(comparisonId).catch(() => {});
    });
  };

  const mute = () => {
    if (!author) return;
    close();
    onDismiss();
    startTransition(() => {
      toggleMuteAction(author.id, true).catch(() => {});
    });
  };

  const block = () => {
    if (!author) return;
    close();
    onDismiss();
    startTransition(() => {
      toggleBlockAction(author.id, true).catch(() => {});
    });
  };

  const submitReport = (reason: ReportReason) => {
    startTransition(async () => {
      try {
        await reportContentAction("comparison", comparisonId, reason);
      } catch {
        // best-effort — still show the thank-you
      }
      setStep("done");
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="More options"
        onClick={() => setOpen(true)}
        className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      <Sheet open={open} onClose={close}>
        {step === "menu" && (
          <div className="space-y-2 py-2">
            <button
              onClick={notInterested}
              className="tap-scale block w-full rounded-lg border border-border px-4 py-3 text-left text-sm font-medium text-text-primary"
            >
              Not interested
            </button>
            {author && (
              <button
                onClick={mute}
                className="tap-scale block w-full rounded-lg border border-border px-4 py-3 text-left text-sm font-medium text-text-primary"
              >
                Mute @{author.username}
              </button>
            )}
            {author && (
              <button
                onClick={block}
                className="tap-scale block w-full rounded-lg border border-border px-4 py-3 text-left text-sm font-medium text-danger"
              >
                Block @{author.username}
              </button>
            )}
            <button
              onClick={() => setStep("report")}
              className="tap-scale block w-full rounded-lg border border-border px-4 py-3 text-left text-sm font-medium text-danger"
            >
              Report
            </button>
          </div>
        )}
        {step === "report" && (
          <div className="space-y-2 py-2">
            <p className="mb-1 font-semibold text-text-primary">Why are you reporting this?</p>
            {REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => submitReport(r.value)}
                className="tap-scale block w-full rounded-lg border border-border px-4 py-3 text-left text-sm text-text-primary"
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
        {step === "done" && (
          <div className="space-y-3 py-4 text-center">
            <p className="font-semibold text-text-primary">Thanks for the report.</p>
            <p className="text-sm text-text-secondary">Our team will take a look.</p>
            <Button className="w-full" onClick={close}>
              Close
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}
