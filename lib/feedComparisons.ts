export interface FeedOptionData {
  id: string;
  label: string;
  imageUrl: string | null;
  voteCount: number;
  /** Set on Duel Mode options - the debater's own point, shown on their tile. */
  statement?: string | null;
  claimant?: { username: string; avatarUrl: string | null } | null;
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
  expiresAt: string | null;
  topComments: FeedCommentPreview[];
  creator: FeedCreator | null;
  followedByMe: boolean;
  repostCount: number;
  repostedByMe: boolean;
  /** Set when this card is here because someone the viewer follows reposted it. */
  repostedBy: string | null;
  hashtags: string[];
  isSponsored: boolean;
  sponsorLabel: string | null;
}

export interface RawFeedComparison {
  id: string;
  prompt: string | null;
  caption: string | null;
  fun_fact: string | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  expires_at: string | null;
  repost_count: number;
  is_sponsored?: boolean;
  sponsor_label?: string | null;
  comparison_hashtags?: { hashtags: { tag: string } | null }[];
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
    statement?: string | null;
    claimant?: { username: string; avatar_url: string | null; profile_photo_url: string | null } | null;
  }[];
}

export function toFeedComparisonData(
  raw: RawFeedComparison,
  votedOptionId: string | null,
  likedByMe: boolean,
  savedByMe: boolean,
  topComments: FeedCommentPreview[] = [],
  followedByMe: boolean = false,
  repostedByMe: boolean = false,
  repostedBy: string | null = null
): FeedComparisonData | null {
  const options = [...raw.comparison_options]
    .sort((a, b) => a.side.localeCompare(b.side))
    .map((o) => ({
      id: o.id,
      label: o.label,
      imageUrl: o.image_url,
      voteCount: o.vote_count,
      statement: o.statement ?? null,
      claimant: o.claimant
        ? { username: o.claimant.username, avatarUrl: o.claimant.profile_photo_url ?? o.claimant.avatar_url }
        : null,
    }));
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
    expiresAt: raw.expires_at,
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
    repostCount: raw.repost_count,
    repostedByMe,
    repostedBy,
    hashtags: (raw.comparison_hashtags ?? []).map((ch) => ch.hashtags?.tag).filter((tag): tag is string => !!tag),
    isSponsored: raw.is_sponsored ?? false,
    sponsorLabel: raw.sponsor_label ?? null,
  };
}
