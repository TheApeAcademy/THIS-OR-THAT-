import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { getHiddenAuthorIds } from "@/lib/blocks";
import { Feed } from "@/components/Feed";

export const dynamic = "force-dynamic";

export default async function CustomFeedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: feed } = await supabase
    .from("custom_feeds")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!feed) notFound();

  const [{ data: rpcRows }, hiddenAuthorIds] = await Promise.all([
    supabase.rpc("get_custom_feed_comparisons", { p_custom_feed_id: feed.id, p_limit: 30 }),
    getHiddenAuthorIds(supabase, user.id),
  ]);

  const ids = (rpcRows ?? []).map((r) => r.comparison_id);
  const { data: raw } = ids.length
    ? await supabase
        .from("comparisons")
        .select(
          "id, prompt, creator_id, status, view_count, expires_at, is_sponsored, sponsor_label, comparison_hashtags(hashtags(tag)), comparison_options(id, side, label, image_url, vote_count)"
        )
        .in("id", ids)
        .returns<(RawComparisonWithOptions & { creator_id: string | null; status: string })[]>()
    : { data: [] as (RawComparisonWithOptions & { creator_id: string | null; status: string })[] };

  const hiddenSet = new Set(hiddenAuthorIds);
  const byId = new Map((raw ?? []).map((c) => [c.id, c]));
  const ordered = ids
    .map((cid) => byId.get(cid))
    .filter((c): c is NonNullable<typeof c> => !!c && c.status === "active" && (!c.creator_id || !hiddenSet.has(c.creator_id)));

  const { data: myVotes } = ordered.length
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", ordered.map((c) => c.id))
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  const cards = ordered
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c) => c !== null);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <h1 className="text-2xl font-bold text-text-primary">{feed.name}</h1>

      {cards.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-secondary">Nothing here yet.</p>
      ) : (
        <div className="-mx-4">
          <Feed initialComparisons={cards} />
        </div>
      )}
    </div>
  );
}
