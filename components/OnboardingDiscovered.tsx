"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getOnboardingStatsAction, type OnboardingStats } from "@/lib/actions/onboarding";

export function OnboardingDiscovered({ onContinue }: { onContinue: () => void }) {
  const [stats, setStats] = useState<OnboardingStats | null>(null);

  useEffect(() => {
    getOnboardingStatsAction().then(setStats);
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-6 px-8 text-center">
      <p className="text-3xl">🧬</p>
      <div>
        <p className="text-2xl font-bold text-text-primary">Your TOT is taking shape</p>
        <p className="mt-2 text-text-secondary">
          {stats ? `${stats.preferencesDiscovered} preferences discovered` : "Crunching your votes…"}
        </p>
      </div>
      <Button onClick={onContinue} className="w-full max-w-xs">
        Continue
      </Button>
    </div>
  );
}
