import type { ComparisonCardData } from "@/components/ComparisonCard";

interface RawOption {
  id: string;
  side: string;
  label: string;
  image_url: string | null;
  vote_count: number;
  statement?: string | null;
  claimed_by?: string | null;
  claimant?: { username: string; avatar_url: string | null; profile_photo_url: string | null } | null;
}

export interface RawComparisonWithOptions {
  id: string;
  prompt: string | null;
  view_count?: number;
  expires_at?: string | null;
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
    viewCount: raw.view_count ?? 0,
    expiresAt: raw.expires_at ?? null,
    options: options.map((o) => ({
      id: o.id,
      label: o.label,
      imageUrl: o.image_url,
      voteCount: o.vote_count,
      statement: o.statement ?? null,
      claimant: o.claimant
        ? { username: o.claimant.username, avatarUrl: o.claimant.profile_photo_url ?? o.claimant.avatar_url }
        : null,
    })),
    votedOptionId: votedOptionId ?? null,
  };
}
