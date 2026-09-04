export type ConfidenceLevel = "insufficient" | "uncertain" | "balanced" | "leaning" | "strong";

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  insufficient: "Not enough data yet",
  uncertain: "Uncertain",
  balanced: "Balanced",
  leaning: "Leaning",
  strong: "Strong preference",
};

/**
 * Never treat one vote as certainty. Confidence grows with sample size
 * (opportunities) and with how far the win rate sits from a coin flip.
 */
export function confidenceLevel(opportunities: number, wins: number): ConfidenceLevel {
  if (opportunities < 3) return "insufficient";
  const winRate = wins / opportunities;
  const distanceFromEven = Math.abs(winRate - 0.5);

  if (opportunities < 8) return distanceFromEven < 0.15 ? "uncertain" : "leaning";
  if (distanceFromEven < 0.1) return "balanced";
  if (distanceFromEven < 0.25) return "leaning";
  return "strong";
}

/** Every inferred preference should be explainable with the evidence behind it. */
export function explanationSentence(label: string, wins: number, opportunities: number): string {
  return `You picked ${label} in ${wins} of ${opportunities} comparisons where it came up.`;
}
