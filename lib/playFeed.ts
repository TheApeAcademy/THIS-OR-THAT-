import type { FeedOptionData } from "@/lib/feedComparisons";

export interface PlayCardData {
  id: string;
  prompt: string | null;
  funFact: string | null;
  subject: string | null;
  correctSide: string | null;
  options: FeedOptionData[];
}

export interface RawPlayComparison {
  id: string;
  prompt: string | null;
  fun_fact: string | null;
  subject: string | null;
  correct_side: string | null;
  comparison_options: {
    id: string;
    side: string;
    label: string;
    image_url: string | null;
    vote_count: number;
  }[];
}

export function toPlayCardData(raw: RawPlayComparison): PlayCardData | null {
  const options = [...raw.comparison_options]
    .sort((a, b) => a.side.localeCompare(b.side))
    .map((o) => ({ id: o.id, label: o.label, imageUrl: o.image_url, voteCount: o.vote_count }));
  if (options.length !== 2) return null;

  return {
    id: raw.id,
    prompt: raw.prompt,
    funFact: raw.fun_fact,
    subject: raw.subject,
    correctSide: raw.correct_side,
    options,
  };
}

export const PLAY_SUBJECTS: { slug: string; label: string; emoji: string }[] = [
  { slug: "space", label: "Space", emoji: "🪐" },
  { slug: "history", label: "History", emoji: "🏛️" },
  { slug: "animals", label: "Animals", emoji: "🦁" },
  { slug: "human-body", label: "Human Body", emoji: "🧠" },
  { slug: "geography", label: "Geography", emoji: "🌍" },
  { slug: "science", label: "Science", emoji: "🔬" },
  { slug: "food", label: "Food", emoji: "🍜" },
];
