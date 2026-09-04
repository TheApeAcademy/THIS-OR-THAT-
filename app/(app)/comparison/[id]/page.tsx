import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { buildCommentTree, type FlatComment } from "@/lib/commentTree";
import { getHiddenAuthorIds } from "@/lib/blocks";
import { ComparisonDetail } from "@/components/ComparisonDetail";
import type { SideData } from "@/components/SideSplitComments";

export const dynamic = "force-dynamic";

const EMPTY_ID = "00000000-0000-0000-0000-000000000000";

export default async function ComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const { data: comparison } = await supabase
    .from("comparisons")
    .select("id, prompt, ai_opinion, comparison_options(id, side, label, image_url, vote_count)")
    .eq("id", id)
    .single<RawComparisonWithOptions & { ai_opinion: string | null }>();

  if (!comparison) notFound();

  const { data: myVote } = await supabase
    .from("votes")
    .select("option_id")
    .eq("comparison_id", id)
    .maybeSingle();

  const cardData = toComparisonCardData(comparison, myVote?.option_id);
  if (!cardData) notFound();

  let sides: SideData[] | null = null;

  if (myVote) {
    const [{ data: comments }, hiddenAuthorIds] = await Promise.all([
      supabase
        .from("comments")
        .select(
          "id, body, option_id, parent_comment_id, like_count, created_at, edited_at, user_id, profiles(username, avatar_url)"
        )
        .eq("comparison_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .returns<FlatComment[]>(),
      getHiddenAuthorIds(supabase, user.id),
    ]);

    const hiddenAuthors = new Set(hiddenAuthorIds);
    const visibleComments = (comments ?? []).filter((c) => !hiddenAuthors.has(c.user_id));

    const commentIds = visibleComments.map((c) => c.id);
    const { data: likedRows } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", commentIds.length > 0 ? commentIds : [EMPTY_ID]);

    const likedIds = new Set((likedRows ?? []).map((r) => r.comment_id));
    const byOption = buildCommentTree(visibleComments, likedIds);

    const orderedOptions = [...comparison.comparison_options].sort((a, b) =>
      a.side.localeCompare(b.side)
    );

    sides = orderedOptions.map((option) => ({
      optionId: option.id,
      label: option.label,
      comments: byOption[option.id] ?? [],
    }));
  }

  return (
    <ComparisonDetail
      comparisonId={id}
      cardData={cardData}
      sides={sides}
      viewerId={user.id}
      viewerUsername={viewerProfile?.username ?? null}
      initialAiOpinion={comparison.ai_opinion}
    />
  );
}
