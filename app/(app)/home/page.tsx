import { createClient } from "@/lib/supabase/server";
import { toFeedComparisonData, type RawFeedComparison, type FeedCommentPreview } from "@/lib/feedComparisons";
import { FullScreenFeed } from "@/components/FullScreenFeed";
import { HomeTourGate } from "@/components/HomeTourGate";
import { StoriesRail, type StoryItem } from "@/components/StoriesRail";

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
  // — no cron/pg_net infra exists, so this piggybacks on Home's own load
  // instead of a true schedule. Fire-and-forget: never blocks render, and a
  // failure here should never break the feed.
  supabase.rpc("sweep_expired_comparisons").then(
    () => {},
    () => {}
  );

  const [{ data: orderRows }, { data: profile }, { data: storyRows }] = await Promise.all([
    supabase.rpc("get_feed_order", { p_user_id: user?.id ?? undefined, p_limit: FEED_SIZE }),
    user
      ? supabase.from("profiles").select("tour_completed_at").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("comparisons")
      .select(
        "id, prompt, expires_at, creator:profiles!comparisons_creator_id_fkey(username, avatar_url, profile_photo_url), comparison_options(label)"
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
          creator: { username: string; avatar_url: string | null; profile_photo_url: string | null } | null;
          comparison_options: { label: string }[];
        }[]
      >(),
  ]);
  const stories: StoryItem[] = (storyRows ?? []).map((s) => ({
    id: s.id,
    heading: s.prompt || s.comparison_options.map((o) => o.label).join(" or "),
    expiresAt: s.expires_at,
    creatorUsername: s.creator?.username ?? null,
    creatorAvatarUrl: s.creator ? (s.creator.profile_photo_url ?? s.creator.avatar_url) : null,
  }));
  const orderedIds = (orderRows ?? []).map((r) => r.comparison_id);

  const { data: comparisons } = orderedIds.length
    ? await supabase
        .from("comparisons")
        .select(
          "id, prompt, caption, fun_fact, like_count, comment_count, view_count, expires_at, creator:profiles!comparisons_creator_id_fkey(id, username, avatar_url, profile_photo_url, is_seed_account), comparison_options(id, side, label, image_url, vote_count)"
        )
        .in("id", orderedIds)
        .returns<RawFeedComparison[]>()
    : { data: [] as RawFeedComparison[] };

  const byId = new Map((comparisons ?? []).map((c) => [c.id, c]));
  const orderedComparisons = orderedIds.map((id) => byId.get(id)).filter((c): c is RawFeedComparison => !!c);

  const comparisonIds = orderedComparisons.map((c) => c.id);
  const idsOrEmpty = comparisonIds.length > 0 ? comparisonIds : [EMPTY_ID];
  const creatorIds = [...new Set(orderedComparisons.map((c) => c.creator?.id).filter((id): id is string => !!id))];
  const creatorIdsOrEmpty = creatorIds.length > 0 ? creatorIds : [EMPTY_ID];

  const [{ data: myVotes }, { data: myLikes }, { data: mySaves }, { data: topComments }, { data: myFollows }] =
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
        c.creator ? followedSet.has(c.creator.id) : false
      )
    )
    .filter((c) => c !== null);

  return (
    <div className="flex h-full flex-col" data-tour="home-feed">
      {stories.length > 0 && <StoriesRail stories={stories} />}
      <div className="min-h-0 flex-1">
        <FullScreenFeed initialComparisons={cards} viewerId={user?.id ?? null} />
      </div>
      {user && <HomeTourGate show={!profile?.tour_completed_at} />}
    </div>
  );
}
