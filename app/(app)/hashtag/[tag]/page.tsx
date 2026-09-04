import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { getHiddenAuthorIds } from "@/lib/blocks";
import { Feed } from "@/components/Feed";

export const dynamic = "force-dynamic";

interface HashtagComparisonRow extends RawComparisonWithOptions {
  creator_id: string | null;
  status: string;
}

interface TaggedRow {
  comparison_id: string;
  comparisons: HashtagComparisonRow;
}

export default async function HashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag).toLowerCase().replace(/^#/, "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: hashtag } = await supabase
    .from("hashtags")
    .select("id, tag, use_count")
    .eq("tag", tag)
    .maybeSingle();

  if (!hashtag) notFound();

  const [{ data: taggedRows }, hiddenAuthorIds] = await Promise.all([
    supabase
      .from("comparison_hashtags")
      .select(
        "comparison_id, comparisons!inner(id, prompt, creator_id, status, view_count, expires_at, comparison_options(id, side, label, image_url, vote_count))"
      )
      .eq("hashtag_id", hashtag.id)
      .eq("comparisons.status", "active")
      .limit(30)
      .returns<TaggedRow[]>(),
    user ? getHiddenAuthorIds(supabase, user.id) : Promise.resolve([] as string[]),
  ]);

  const hiddenSet = new Set(hiddenAuthorIds);
  const comparisons = (taggedRows ?? [])
    .map((r) => r.comparisons)
    .filter((c) => c && (!c.creator_id || !hiddenSet.has(c.creator_id)));

  const ids = comparisons.map((c) => c.id);
  const { data: myVotes } = user && ids.length
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", ids)
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  const cards = comparisons
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c) => c !== null);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">#{hashtag.tag}</h1>
        <p className="text-sm text-text-secondary">{hashtag.use_count} debates</p>
      </div>

      {cards.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-secondary">
          No debates tagged #{hashtag.tag} yet.
        </p>
      ) : (
        <div className="-mx-4">
          <Feed initialComparisons={cards} />
        </div>
      )}
    </div>
  );
}
