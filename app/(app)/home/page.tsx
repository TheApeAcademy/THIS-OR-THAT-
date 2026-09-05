import { createClient } from "@/lib/supabase/server";
import { toFeedComparisonData, type RawFeedComparison, type FeedCommentPreview } from "@/lib/feedComparisons";
import { getMutedWords, containsMutedWord } from "@/lib/mutedWords";
import { FullScreenFeed } from "@/components/FullScreenFeed";
import { HomeTourGate } from "@/components/HomeTourGate";
import { StoriesRail, type StoryItem } from "@/components/StoriesRail";
import { StreakRiskBanner } from "@/components/StreakRiskBanner";

export const dynamic = "force-dynamic";

const EMPTY_ID = "00000000-0000-0000-0000-000000000000";
const COMMENTS_PER_CARD = 3;
const FEED_SIZE = 30;

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lazy sweep for expired time-boxed polls (see 0066_debate_result_sweep.sql)
  // - no cron/pg_net infra exists, so this piggybacks on Home's own load
  // instead of a true schedule. Fire-and-forget: never blocks render, and a
  // failure here should never break the feed.
  supabase.rpc("sweep_expired_comparisons").then(
    () => {},
    () => {}
  );

  const [{ data: orderRows }, { data: profile }, { data: storyRows }, { data: repostRows }, mutedWords] =
    await Promise.all([
      supabase.rpc("get_feed_order", { p_user_id: user?.id ?? undefined, p_limit: FEED_SIZE }),
      user
        ? supabase
            .from("profiles")
            .select("tour_completed_at, current_streak, last_active_date, streak_freezes, hide_sensitive_content")
            .eq("id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("comparisons")
        .select(
          "id, prompt, expires_at, creator:profiles!comparisons_creator_id_fkey(username, avatar_url, profile_photo_url, is_seed_account), comparison_options!comparison_options_comparison_id_fkey(label)"
        )
        .eq("status", "active")
        .not("expires_at", "is", null)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: true })
        .limit(15)
        .returns<
          {
            id: string;
            prompt: string | null;
            expires_at: string;
            creator: {
              username: string;
              avatar_url: string | null;
              profile_photo_url: string | null;
              is_seed_account: boolean;
            } | null;
            comparison_options: { label: string }[];
          }[]
        >(),
      user
        ? supabase.rpc("get_recent_reposts_from_followed", { p_user_id: user.id, p_limit: 5 })
        : Promise.resolve({ data: [] }),
      user ? getMutedWords(supabase, user.id) : Promise.resolve([] as string[]),
    ]);
  const hideSensitive = profile?.hide_sensitive_content ?? true;
  // Seed/curated content is attributed to "This or That" in the UI, never to
  // the placeholder persona backing it (see FeedSlide's AuthorRow) - Stories
  // needs the same guard so a seed-authored poll can't leak a fake identity.
  const stories: StoryItem[] = (storyRows ?? []).map((s) => ({
    id: s.id,
    heading: s.prompt || s.comparison_options.map((o) => o.label).join(" or "),
    expiresAt: s.expires_at,
    creatorUsername: s.creator && !s.creator.is_seed_account ? s.creator.username : null,
    creatorAvatarUrl:
      s.creator && !s.creator.is_seed_account ? (s.creator.profile_photo_url ?? s.creator.avatar_url) : null,
  }));

  // Reposts from people the viewer follows get pinned to the top of the
  // feed with "reposted by @x" attribution - a light, additive splice
  // rather than touching get_feed_order()'s core ranking SQL.
  const repostedByMap = new Map((repostRows ?? []).map((r) => [r.comparison_id, r.reposter_username]));
  const repostIds = (repostRows ?? []).map((r) => r.comparison_id);
  const rankedIds = (orderRows ?? []).map((r) => r.comparison_id).filter((id) => !repostedByMap.has(id));
  const orderedIds = [...repostIds, ...rankedIds];

  const { data: comparisons } = orderedIds.length
    ? await supabase
        .from("comparisons")
        .select(
          "id, prompt, caption, fun_fact, like_count, comment_count, view_count, expires_at, created_at, repost_count, is_sponsored, sponsor_label, sensitive_content, comparison_hashtags(hashtags(tag)), creator:profiles!comparisons_creator_id_fkey(id, username, avatar_url, profile_photo_url, is_seed_account), comparison_options!comparison_options_comparison_id_fkey(id, side, label, image_url, vote_count, statement, claimant:profiles!comparison_options_claimed_by_fkey(username, avatar_url, profile_photo_url))"
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
      user
        ? supabase.from("votes").select("comparison_id, option_id").in("comparison_id", comparisonIds)
        : Promise.resolve({ data: [] }),
      user
        ? supabase
            .from("comparison_likes")
            .select("comparison_id")
            .eq("user_id", user.id)
            .in("comparison_id", idsOrEmpty)
        : Promise.resolve({ data: [] }),
      user
        ? supabase
            .from("saved_comparisons")
            .select("comparison_id")
            .eq("user_id", user.id)
            .in("comparison_id", idsOrEmpty)
        : Promise.resolve({ data: [] }),
      user
        ? supabase
            .from("comparison_reposts")
            .select("comparison_id")
            .eq("user_id", user.id)
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
      user
        ? supabase.from("follows").select("followee_id").eq("follower_id", user.id).in("followee_id", creatorIdsOrEmpty)
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

  const cards = orderedComparisons
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

  const today = new Date().toISOString().slice(0, 10);
  const streakAtRisk = !!user && (profile?.current_streak ?? 0) > 0 && profile?.last_active_date !== today;

  return (
    <div className="flex h-full flex-col" data-tour="home-feed">
      {streakAtRisk && (
        <StreakRiskBanner
          streak={profile?.current_streak ?? 0}
          hasFreeze={(profile?.streak_freezes ?? 0) > 0}
        />
      )}
      {stories.length > 0 && <StoriesRail stories={stories} />}
      <div className="min-h-0 flex-1">
        <FullScreenFeed initialComparisons={cards} viewerId={user?.id ?? null} />
      </div>
      {user && <HomeTourGate show={!profile?.tour_completed_at} />}
    </div>
  );
}
