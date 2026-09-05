import type { createClient } from "@/lib/supabase/server";
import { toFeedComparisonData, type RawFeedComparison, type FeedCommentPreview } from "@/lib/feedComparisons";
import { containsMutedWord } from "@/lib/mutedWords";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const EMPTY_ID = "00000000-0000-0000-0000-000000000000";
const COMMENTS_PER_CARD = 3;

// Shared by every Home feed tab (For You, Following, Latest, Trending):
// each tab only differs in how it computes `orderedIds` - this does the
// common work of hydrating those ids into full feed cards (sensitive/muted
// filtering, votes/likes/saves/reposts/comments/follows) exactly once.
export async function buildFeedCards(
  supabase: SupabaseClient,
  userId: string | null,
  orderedIds: string[],
  mutedWords: string[],
  hideSensitive: boolean,
  repostedByMap: Map<string, string> = new Map()
) {
  const { data: comparisons } = orderedIds.length
    ? await supabase
        .from("comparisons")
        .select(
          "id, prompt, caption, fun_fact, like_count, comment_count, view_count, expires_at, created_at, pinned_at, comments_locked, repost_count, is_sponsored, sponsor_label, sensitive_content, comparison_hashtags(hashtags(tag)), creator:profiles!comparisons_creator_id_fkey(id, username, avatar_url, profile_photo_url, is_seed_account), comparison_options!comparison_options_comparison_id_fkey(id, side, label, image_url, vote_count, statement, claimant:profiles!comparison_options_claimed_by_fkey(username, avatar_url, profile_photo_url))"
        )
        .in("id", orderedIds)
        .returns<(RawFeedComparison & { sensitive_content: boolean })[]>()
    : { data: [] as (RawFeedComparison & { sensitive_content: boolean })[] };

  const byId = new Map((comparisons ?? []).map((c) => [c.id, c]));
  const orderedComparisons = orderedIds
    .map((id) => byId.get(id))
    .filter((c): c is RawFeedComparison & { sensitive_content: boolean } => !!c)
    .filter((c) => !(hideSensitive && c.sensitive_content))
    .filter((c) => !containsMutedWord(c.prompt, mutedWords) && !containsMutedWord(c.caption, mutedWords));

  const comparisonIds = orderedComparisons.map((c) => c.id);
  const idsOrEmpty = comparisonIds.length > 0 ? comparisonIds : [EMPTY_ID];
  const creatorIds = [...new Set(orderedComparisons.map((c) => c.creator?.id).filter((id): id is string => !!id))];
  const creatorIdsOrEmpty = creatorIds.length > 0 ? creatorIds : [EMPTY_ID];

  const [{ data: myVotes }, { data: myLikes }, { data: mySaves }, { data: myReposts }, { data: topComments }, { data: myFollows }] =
    await Promise.all([
      userId
        ? supabase.from("votes").select("comparison_id, option_id").in("comparison_id", comparisonIds)
        : Promise.resolve({ data: [] }),
      userId
        ? supabase
            .from("comparison_likes")
            .select("comparison_id")
            .eq("user_id", userId)
            .in("comparison_id", idsOrEmpty)
        : Promise.resolve({ data: [] }),
      userId
        ? supabase
            .from("saved_comparisons")
            .select("comparison_id")
            .eq("user_id", userId)
            .in("comparison_id", idsOrEmpty)
        : Promise.resolve({ data: [] }),
      userId
        ? supabase
            .from("comparison_reposts")
            .select("comparison_id")
            .eq("user_id", userId)
            .in("comparison_id", idsOrEmpty)
        : Promise.resolve({ data: [] }),
      supabase
        .from("comments")
        .select("id, comparison_id, body, like_count, profiles(username, avatar_url, profile_photo_url)")
        .eq("status", "active")
        .in("comparison_id", idsOrEmpty)
        .order("like_count", { ascending: false })
        .order("created_at", { ascending: false })
        .returns<
          {
            id: string;
            comparison_id: string;
            body: string;
            like_count: number;
            profiles: { username: string; avatar_url: string | null; profile_photo_url: string | null } | null;
          }[]
        >(),
      userId
        ? supabase.from("follows").select("followee_id").eq("follower_id", userId).in("followee_id", creatorIdsOrEmpty)
        : Promise.resolve({ data: [] }),
    ]);

  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));
  const likedSet = new Set((myLikes ?? []).map((l) => l.comparison_id));
  const savedSet = new Set((mySaves ?? []).map((s) => s.comparison_id));
  const repostedSet = new Set((myReposts ?? []).map((r) => r.comparison_id));
  const followedSet = new Set((myFollows ?? []).map((f) => f.followee_id));

  const commentsByComparison = new Map<string, FeedCommentPreview[]>();
  for (const c of topComments ?? []) {
    const list = commentsByComparison.get(c.comparison_id) ?? [];
    if (list.length < COMMENTS_PER_CARD) {
      list.push({
        id: c.id,
        body: c.body,
        likeCount: c.like_count,
        author: {
          username: c.profiles?.username ?? "unknown",
          avatarUrl: c.profiles?.profile_photo_url ?? c.profiles?.avatar_url ?? null,
        },
      });
      commentsByComparison.set(c.comparison_id, list);
    }
  }

  return orderedComparisons
    .map((c) =>
      toFeedComparisonData(
        c,
        votedByComparison.get(c.id) ?? null,
        likedSet.has(c.id),
        savedSet.has(c.id),
        commentsByComparison.get(c.id) ?? [],
        c.creator ? followedSet.has(c.creator.id) : false,
        repostedSet.has(c.id),
        repostedByMap.get(c.id) ?? null
      )
    )
    .filter((c) => c !== null);
}
