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

export interface FeedCreator {
  id: string;
  username: string;
  avatarUrl: string | null;
  isSeedAccount: boolean;
}

export interface FeedComparisonData {
  id: string;
  prompt: string | null;
  caption: string | null;
  funFact: string | null;
  options: FeedOptionData[];
  votedOptionId: string | null;
  likeCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  commentCount: number;
  viewCount: number;
  topComments: FeedCommentPreview[];
  creator: FeedCreator | null;
  followedByMe: boolean;
}

export interface RawFeedComparison {
  id: string;
  prompt: string | null;
  caption: string | null;
  fun_fact: string | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  creator: {
    id: string;
    username: string;
    avatar_url: string | null;
    profile_photo_url: string | null;
    is_seed_account: boolean;
  } | null;
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
  topComments: FeedCommentPreview[] = [],
  followedByMe: boolean = false
): FeedComparisonData | null {
  const options = [...raw.comparison_options]
    .sort((a, b) => a.side.localeCompare(b.side))
    .map((o) => ({ id: o.id, label: o.label, imageUrl: o.image_url, voteCount: o.vote_count }));
  if (options.length < 2 || options.length > 6) return null;

  return {
    id: raw.id,
    prompt: raw.prompt,
    caption: raw.caption,
    funFact: raw.fun_fact,
    options,
    votedOptionId,
    likeCount: raw.like_count,
    likedByMe,
    savedByMe,
    commentCount: raw.comment_count,
    viewCount: raw.view_count,
    topComments,
    creator: raw.creator
      ? {
          id: raw.creator.id,
          username: raw.creator.username,
          avatarUrl: raw.creator.profile_photo_url ?? raw.creator.avatar_url,
          isSeedAccount: raw.creator.is_seed_account,
        }
      : null,
    followedByMe,
  };
}
