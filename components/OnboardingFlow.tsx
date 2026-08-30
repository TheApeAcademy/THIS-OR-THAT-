"use client";

import { useState, useTransition } from "react";
import { voteAction } from "@/lib/actions/vote";
import { buildOnboardingDeckAction, completeOnboardingAction, type OnboardingComparison } from "@/lib/actions/onboarding";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { SwipeDeck } from "@/components/SwipeDeck";
import { CategoryPicker, type CategoryOption } from "@/components/CategoryPicker";
import { OnboardingPersonalDetails } from "@/components/OnboardingPersonalDetails";
import { OnboardingReview } from "@/components/OnboardingReview";

type Phase = "details" | "categories" | "voting" | "review";

export function OnboardingFlow({ categories }: { categories: CategoryOption[] }) {
  const [phase, setPhase] = useState<Phase>("details");
  const [deck, setDeck] = useState<OnboardingComparison[] | null>(null);
  const [index, setIndex] = useState(0);
  const [isBuilding, startBuilding] = useTransition();
  const [, startTransition] = useTransition();

  const startDeck = (categoryIds: string[]) => {
    startBuilding(async () => {
      const built = await buildOnboardingDeckAction(categoryIds);
      setDeck(built);
      setPhase("voting");
    });
  };

  if (phase === "details") {
    return <OnboardingPersonalDetails onContinue={() => setPhase("categories")} />;
  }

  if (phase === "categories" || !deck) {
    return <CategoryPicker categories={categories} onContinue={startDeck} isPending={isBuilding} />;
  }

  if (phase === "review") {
    return <OnboardingReview onFinish={() => startTransition(() => completeOnboardingAction())} />;
  }

  const current = deck[index];

  const handleVote = (comparisonId: string, optionId: string) => {
    startTransition(async () => {
      await voteAction(comparisonId, optionId);
      if (index + 1 >= deck.length) {
        setPhase("review");
      } else {
        setIndex((i) => i + 1);
      }
    });
  };

  if (!current) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-2xl font-bold text-text-primary">🎉 Your This or That profile is ready.</p>
        <Button onClick={() => setPhase("review")}>Continue</Button>
      </div>
    );
  }

  const deckItems = deck
    .map((c) => {
      const optionA = c.comparison_options.find((o) => o.side === "a");
      const optionB = c.comparison_options.find((o) => o.side === "b");
      if (!optionA || !optionB) return null;
      return { id: c.id, optionA, optionB };
    })
    .filter((item) => item !== null);

  const currentOptionA = current.comparison_options.find((o) => o.side === "a");
  const currentOptionB = current.comparison_options.find((o) => o.side === "b");

  return (
    <div
      className="flex h-[100dvh] flex-col gap-6 px-6 pb-10"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)" }}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-text-secondary">
          {index + 1} of {deck.length}
        </p>
        <ProgressBar percentage={(index / deck.length) * 100} />
      </div>
      <p className="text-center text-lg font-semibold text-text-primary">This or that?</p>
      <SwipeDeck queue={deckItems} index={index} onVote={handleVote} />
      {currentOptionA && currentOptionB && (
        <p className="text-center text-xs text-text-secondary">
          Swipe left for {currentOptionA.label} · Swipe right for {currentOptionB.label}
        </p>
      )}
    </div>
  );
}
