import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { getHiddenAuthorIds } from "@/lib/blocks";
import { SearchBar, type TopicWithFollow } from "@/components/SearchBar";
import type { ComparisonCardData } from "@/components/ComparisonCard";

export const dynamic = "force-dynamic";

const TRENDING_SIZE = 10;

interface TrendingRow extends RawComparisonWithOptions {
  creator_id: string | null;
}

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: me }, { data: orderRows }, { data: topicRows }, hiddenAuthorIds] = await Promise.all([
    user ? supabase.from("profiles").select("username").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.rpc("get_trending_comparisons", { p_limit: TRENDING_SIZE + 10 }),
    supabase.from("topics").select("id, slug, label, follower_count").order("follower_count", { ascending: false }).limit(12),
    user ? getHiddenAuthorIds(supabase, user.id) : Promise.resolve([] as string[]),
  ]);

  const hiddenSet = new Set(hiddenAuthorIds);
  const orderedIds = (orderRows ?? []).map((r) => r.comparison_id);

  const { data: comparisons } = orderedIds.length
    ? await supabase
        .from("comparisons")
        .select("id, prompt, caption, creator_id, comparison_options(id, side, label, image_url, vote_count)")
        .in("id", orderedIds)
        .returns<TrendingRow[]>()
    : { data: [] as TrendingRow[] };

  const byId = new Map((comparisons ?? []).map((c) => [c.id, c]));
  const trendingRows = orderedIds
    .map((id) => byId.get(id))
    .filter((c): c is TrendingRow => !!c && (!c.creator_id || !hiddenSet.has(c.creator_id)))
    .slice(0, TRENDING_SIZE);

  const trendingIds = trendingRows.map((c) => c.id);
  const { data: myVotes } = user
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", trendingIds)
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  const trending: ComparisonCardData[] = trendingRows
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c): c is ComparisonCardData => c !== null);

  const { data: myTopicFollows } = user
    ? await supabase.from("topic_follows").select("topic_id").eq("user_id", user.id)
    : { data: [] };
  const followedTopicIds = new Set((myTopicFollows ?? []).map((t) => t.topic_id));

  const topics: TopicWithFollow[] = (topicRows ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    label: t.label,
    followerCount: t.follower_count,
    followedByMe: followedTopicIds.has(t.id),
  }));

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      <h1 className="mb-4 text-2xl font-bold text-text-primary">Search</h1>
      <SearchBar myUsername={me?.username ?? null} initialTrending={trending} initialTopics={topics} />
    </div>
  );
}
