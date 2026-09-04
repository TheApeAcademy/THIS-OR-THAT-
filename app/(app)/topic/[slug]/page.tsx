import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { getHiddenAuthorIds } from "@/lib/blocks";
import { Feed } from "@/components/Feed";
import { TopicFollowButton } from "@/components/TopicFollowButton";

export const dynamic = "force-dynamic";

interface TopicComparisonRow extends RawComparisonWithOptions {
  creator_id: string | null;
  status: string;
}

interface TaggedRow {
  comparison_id: string;
  comparisons: TopicComparisonRow;
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: topic } = await supabase
    .from("topics")
    .select("id, label, follower_count")
    .eq("slug", slug)
    .maybeSingle();

  if (!topic) notFound();

  const [{ data: myFollow }, { data: taggedRows }, hiddenAuthorIds] = await Promise.all([
    user
      ? supabase
          .from("topic_follows")
          .select("topic_id")
          .eq("user_id", user.id)
          .eq("topic_id", topic.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("comparison_topics")
      .select(
        "comparison_id, comparisons!inner(id, prompt, caption, creator_id, status, comparison_options(id, side, label, image_url, vote_count))"
      )
      .eq("topic_id", topic.id)
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
  const { data: myVotes } = user
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", ids)
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  const cards = comparisons
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c) => c !== null);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">#{topic.label}</h1>
          <p className="text-sm text-text-secondary">{topic.follower_count} followers</p>
        </div>
        <TopicFollowButton
          topicId={topic.id}
          viewerId={user?.id ?? null}
          initialFollowing={!!myFollow}
        />
      </div>

      {cards.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-secondary">
          No debates tagged #{topic.label} yet.
        </p>
      ) : (
        <div className="-mx-4">
          <Feed initialComparisons={cards} />
        </div>
      )}
    </div>
  );
}
