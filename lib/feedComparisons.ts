export interface FeedOptionData {
  id: string;
  label: string;
  imageUrl: string | null;
  voteCount: number;
}

export interface FeedCommentPreview {
  id: string;
  body: string;
  likeCount: number;
  author: { username: string; avatarUrl: string | null };
}

export interface FeedComparisonData {
  id: string;
  prompt: string | null;
  caption: string | null;
  options: FeedOptionData[];
  votedOptionId: string | null;
  likeCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  commentCount: number;
  topComments: FeedCommentPreview[];
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
  savedByMe: boolean,
  topComments: FeedCommentPreview[] = []
): FeedComparisonData | null {
  const options = [...raw.comparison_options]
    .sort((a, b) => a.side.localeCompare(b.side))
    .map((o) => ({ id: o.id, label: o.label, imageUrl: o.image_url, voteCount: o.vote_count }));
  if (options.length < 2 || options.length > 4) return null;

  return {
    id: raw.id,
    prompt: raw.prompt,
    caption: raw.caption,
    options,
    votedOptionId,
    likeCount: raw.like_count,
    likedByMe,
    savedByMe,
    commentCount: raw.comment_count,
    topComments,
  };
}
