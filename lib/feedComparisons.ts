export interface FeedOptionData {
  id: string;
  label: string;
  imageUrl: string | null;
  voteCount: number;
}

export interface FeedComparisonData {
  id: string;
  prompt: string | null;
  caption: string | null;
  optionA: FeedOptionData;
  optionB: FeedOptionData;
  votedOptionId: string | null;
  likeCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  commentCount: number;
}

export interface RawFeedComparison {
  id: string;
  prompt: string | null;
  caption: string | null;
  like_count: number;
  comment_count: number;
  comparison_options: {
    id: string;
    side: string;
    label: string;
    image_url: string | null;
    vote_count: number;
  }[];
}

export function toFeedComparisonData(
  raw: RawFeedComparison,
  votedOptionId: string | null,
  likedByMe: boolean,
  savedByMe: boolean
): FeedComparisonData | null {
  const options = [...raw.comparison_options].sort((a, b) => a.side.localeCompare(b.side));
  if (options.length !== 2) return null;
  const [a, b] = options;

  return {
    id: raw.id,
    prompt: raw.prompt,
    caption: raw.caption,
    optionA: { id: a.id, label: a.label, imageUrl: a.image_url, voteCount: a.vote_count },
    optionB: { id: b.id, label: b.label, imageUrl: b.image_url, voteCount: b.vote_count },
    votedOptionId,
    likeCount: raw.like_count,
    likedByMe,
    savedByMe,
    commentCount: raw.comment_count,
  };
}
