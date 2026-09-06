"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TourOverlay, type TourStep } from "@/components/TourOverlay";
import { buzz, HAPTIC } from "@/lib/haptics";

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="home-feed"]',
    title: "Your feed",
    body: "Vote on This or That comparisons - tap a side or swipe.",
  },
  { selector: '[data-tour="tab-play"]', title: "Play", body: "Trivia mode - test what you know and climb the leaderboard." },
  {
    selector: '[data-tour="tab-notifications"]',
    title: "Notifications",
    body: "Likes, comments, follows, and card views all land here.",
  },
  { selector: '[data-tour="tab-search"]', title: "Search", body: "Browse and search for comparisons outside your feed." },
  { selector: '[data-tour="tab-create"]', title: "Create", body: "Make your own This or That for others to vote on." },
  {
    selector: '[data-tour="tab-profile"]',
    title: "Profile",
    body: "Your TOT card, Preference DNA, and settings all live here.",
  },
];

export function AppTour({ onComplete }: { onComplete: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(STEPS[stepIndex].selector);
      setRect(el?.getBoundingClientRect() ?? null);
    });
    return () => cancelAnimationFrame(raf);
  }, [mounted, stepIndex]);

  if (!mounted) return null;

  const finish = () => {
    onComplete();
  };

  const next = () => {
    buzz(HAPTIC.tap);
    if (stepIndex >= STEPS.length - 1) finish();
    else setStepIndex((i) => i + 1);
  };

  return createPortal(
    <TourOverlay
      step={STEPS[stepIndex]}
      stepIndex={stepIndex}
      totalSteps={STEPS.length}
      targetRect={rect}
      onNext={next}
      onSkip={finish}
    />,
    document.body
  );
}
