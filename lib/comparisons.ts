import type { ComparisonCardData } from "@/components/ComparisonCard";

interface RawOption {
  id: string;
  side: string;
  label: string;
  image_url: string | null;
  vote_count: number;
}

export interface RawComparisonWithOptions {
  id: string;
  prompt: string | null;
  comparison_options: RawOption[];
}

export function toComparisonCardData(
  raw: RawComparisonWithOptions,
  votedOptionId?: string | null
): ComparisonCardData | null {
  const optionA = raw.comparison_options.find((o) => o.side === "a");
  const optionB = raw.comparison_options.find((o) => o.side === "b");
  if (!optionA || !optionB) return null;

  return {
    id: raw.id,
    prompt: raw.prompt,
    optionA: { id: optionA.id, label: optionA.label, imageUrl: optionA.image_url, voteCount: optionA.vote_count },
    optionB: { id: optionB.id, label: optionB.label, imageUrl: optionB.image_url, voteCount: optionB.vote_count },
    votedOptionId: votedOptionId ?? null,
  };
}
