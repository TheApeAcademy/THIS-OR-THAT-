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
  const options = [...raw.comparison_options].sort((a, b) => a.side.localeCompare(b.side));
  if (options.length < 2) return null;

  return {
    id: raw.id,
    prompt: raw.prompt,
    options: options.map((o) => ({
      id: o.id,
      label: o.label,
      imageUrl: o.image_url,
      voteCount: o.vote_count,
    })),
    votedOptionId: votedOptionId ?? null,
  };
}
