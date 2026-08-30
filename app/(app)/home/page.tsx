import { createClient } from "@/lib/supabase/server";
import { toFeedComparisonData, type RawFeedComparison } from "@/lib/feedComparisons";
import { FullScreenFeed } from "@/components/FullScreenFeed";

export const dynamic = "force-dynamic";

const EMPTY_ID = "00000000-0000-0000-0000-000000000000";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: comparisons } = await supabase
    .from("comparisons")
    .select(
      "id, prompt, caption, like_count, comment_count, comparison_options(id, side, label, image_url, vote_count)"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<RawFeedComparison[]>();

  const comparisonIds = (comparisons ?? []).map((c) => c.id);

  const [{ data: myVotes }, { data: myLikes }, { data: mySaves }] = await Promise.all([
    user
      ? supabase.from("votes").select("comparison_id, option_id").in("comparison_id", comparisonIds)
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from("comparison_likes")
          .select("comparison_id")
          .eq("user_id", user.id)
          .in("comparison_id", comparisonIds.length > 0 ? comparisonIds : [EMPTY_ID])
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from("saved_comparisons")
          .select("comparison_id")
          .eq("user_id", user.id)
          .in("comparison_id", comparisonIds.length > 0 ? comparisonIds : [EMPTY_ID])
      : Promise.resolve({ data: [] }),
  ]);

  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));
  const likedSet = new Set((myLikes ?? []).map((l) => l.comparison_id));
  const savedSet = new Set((mySaves ?? []).map((s) => s.comparison_id));

  const cards = (comparisons ?? [])
    .map((c) =>
      toFeedComparisonData(
        c,
        votedByComparison.get(c.id) ?? null,
        likedSet.has(c.id),
        savedSet.has(c.id)
      )
    )
    .filter((c) => c !== null);

  return (
    <div className="h-full">
      <FullScreenFeed initialComparisons={cards} />
    </div>
  );
}
