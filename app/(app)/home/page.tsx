import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { Feed } from "@/components/Feed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: comparisons } = await supabase
    .from("comparisons")
    .select("id, prompt, comparison_options(id, side, label, image_url, vote_count)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<RawComparisonWithOptions[]>();

  const comparisonIds = comparisons?.map((c) => c.id) ?? [];
  const { data: myVotes } = user
    ? await supabase
        .from("votes")
        .select("comparison_id, option_id")
        .in("comparison_id", comparisonIds)
    : { data: [] };

  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  const cards = (comparisons ?? [])
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c) => c !== null);

  return (
    <div>
      <h1 className="px-4 pt-4 text-2xl font-bold text-text-primary">Home</h1>
      <Feed initialComparisons={cards} />
    </div>
  );
}
