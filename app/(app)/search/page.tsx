import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { getRecentSearchesAction } from "@/lib/actions/search";
import { SearchPanel } from "@/components/SearchPanel";
import type { TopicSearchResult } from "@/lib/actions/search";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: me }, { data: trendingIds }, { data: topics }, recentSearches] = await Promise.all([
    user ? supabase.from("profiles").select("username").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.rpc("get_trending_comparisons", { p_limit: 10 }),
    supabase
      .from("topics")
      .select("id, slug, label, follower_count")
      .order("follower_count", { ascending: false })
      .limit(10),
    getRecentSearchesAction(),
  ]);

  const ids = (trendingIds ?? []).map((r) => r.comparison_id);
  const { data: trendingRaw } = ids.length
    ? await supabase
        .from("comparisons")
        .select(
          "id, prompt, view_count, expires_at, is_sponsored, sponsor_label, comparison_hashtags(hashtags(tag)), comparison_options!comparison_options_comparison_id_fkey(id, side, label, image_url, vote_count, statement, claimant:profiles!comparison_options_claimed_by_fkey(username, avatar_url, profile_photo_url))"
        )
        .in("id", ids)
        .returns<RawComparisonWithOptions[]>()
    : { data: [] as RawComparisonWithOptions[] };

  const byId = new Map((trendingRaw ?? []).map((c) => [c.id, c]));
  const ordered = ids.map((id) => byId.get(id)).filter((c): c is RawComparisonWithOptions => !!c);

  const { data: myVotes } = user && ids.length
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", ids)
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  const trendingCards = ordered
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c) => c !== null);

  const popularTopics: TopicSearchResult[] = (topics ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    label: t.label,
    followerCount: t.follower_count,
  }));

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      <h1 className="text-2xl font-bold text-text-primary">Search</h1>
      <SearchPanel
        myUsername={me?.username ?? null}
        initialTrendingCards={trendingCards}
        initialPopularTopics={popularTopics}
        initialRecentSearches={recentSearches}
      />
    </div>
  );
}
