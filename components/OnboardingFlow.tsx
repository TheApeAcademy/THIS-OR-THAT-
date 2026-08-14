"use client";

import { useState, useTransition } from "react";
import { voteAction } from "@/lib/actions/vote";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

interface RawOption {
  id: string;
  side: string;
  label: string;
  image_url: string | null;
}

interface RawComparison {
  id: string;
  prompt: string | null;
  comparison_options: RawOption[];
}

export function OnboardingFlow({ comparisons }: { comparisons: RawComparison[] }) {
  const [ordered] = useState(comparisons);
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const current = ordered[index];

  const handleVote = (optionId: string) => {
    if (!current || isPending) return;
    startTransition(async () => {
      await voteAction(current.id, optionId);
      if (index + 1 >= ordered.length) {
        await completeOnboardingAction();
      } else {
        setIndex((i) => i + 1);
      }
    });
  };

  if (!current) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-2xl font-bold text-text-primary">🎉 Your This or That profile is ready.</p>
        <Button onClick={() => startTransition(() => completeOnboardingAction())}>
          Continue
        </Button>
      </div>
    );
  }

  const optionA = current.comparison_options.find((o) => o.side === "a");
  const optionB = current.comparison_options.find((o) => o.side === "b");
  if (!optionA || !optionB) return null;

  return (
    <div
      className="flex h-[100dvh] flex-col gap-8 px-6 pb-10"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)" }}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-text-secondary">
          {index + 1} of {ordered.length}
        </p>
        <ProgressBar percentage={(index / ordered.length) * 100} />
      </div>
      <p className="text-center text-lg font-semibold text-text-primary">This or that?</p>
      <div className="grid flex-1 grid-rows-2 gap-4">
        {[optionA, optionB].map((option) => (
          <button
            key={option.id}
            disabled={isPending}
            onClick={() => handleVote(option.id)}
            className="tap-scale flex items-center justify-center rounded-xl border border-border bg-surface-raised px-6 text-center text-2xl font-bold text-text-primary shadow-sm disabled:opacity-60"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
