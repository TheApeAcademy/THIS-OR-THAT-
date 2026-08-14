"use client";

import { useState } from "react";
import { ComparisonCard, type ComparisonCardData } from "@/components/ComparisonCard";

const DEMO_COMPARISONS: ComparisonCardData[] = [
  {
    id: "1",
    optionA: { id: "1a", label: "BMW", voteCount: 63 },
    optionB: { id: "1b", label: "Mercedes", voteCount: 37 },
  },
  {
    id: "2",
    optionA: { id: "2a", label: "Barcelona", voteCount: 54 },
    optionB: { id: "2b", label: "Miami", voteCount: 46 },
  },
];

export default function HomePage() {
  const [comparisons, setComparisons] = useState(DEMO_COMPARISONS);

  const handleVote = (comparisonId: string, optionId: string) => {
    setComparisons((prev) =>
      prev.map((c) =>
        c.id === comparisonId
          ? {
              ...c,
              votedOptionId: optionId,
              optionA: c.optionA.id === optionId ? { ...c.optionA, voteCount: c.optionA.voteCount + 1 } : c.optionA,
              optionB: c.optionB.id === optionId ? { ...c.optionB, voteCount: c.optionB.voteCount + 1 } : c.optionB,
            }
          : c
      )
    );
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      <h1 className="text-2xl font-bold text-text-primary">Home</h1>
      {comparisons.map((comparison) => (
        <ComparisonCard
          key={comparison.id}
          comparison={comparison}
          onVote={(optionId) => handleVote(comparison.id, optionId)}
        />
      ))}
    </div>
  );
}
