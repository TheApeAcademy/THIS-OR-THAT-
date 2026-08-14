import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { buildCommentTree, type FlatComment } from "@/lib/commentTree";
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

  const { data: comparison } = await supabase
    .from("comparisons")
    .select("id, prompt, comparison_options(id, side, label, image_url, vote_count)")
    .eq("id", id)
    .single<RawComparisonWithOptions>();

  if (!comparison) notFound();

  const { data: myVote } = await supabase
    .from("votes")
    .select("option_id")
    .eq("comparison_id", id)
    .maybeSingle();

  const cardData = toComparisonCardData(comparison, myVote?.option_id);
  if (!cardData) notFound();

  let sides: [SideData, SideData] | null = null;

  if (myVote) {
    const { data: comments } = await supabase
      .from("comments")
      .select("id, body, option_id, parent_comment_id, like_count, created_at, profiles(username, avatar_url)")
      .eq("comparison_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .returns<FlatComment[]>();

    const commentIds = (comments ?? []).map((c) => c.id);
    const { data: likedRows } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", commentIds.length > 0 ? commentIds : [EMPTY_ID]);

    const likedIds = new Set((likedRows ?? []).map((r) => r.comment_id));
    const byOption = buildCommentTree(comments ?? [], likedIds);

    const optionA = comparison.comparison_options.find((o) => o.side === "a")!;
    const optionB = comparison.comparison_options.find((o) => o.side === "b")!;

    sides = [
      { optionId: optionA.id, label: optionA.label, comments: byOption[optionA.id] ?? [] },
      { optionId: optionB.id, label: optionB.label, comments: byOption[optionB.id] ?? [] },
    ];
  }

  return <ComparisonDetail comparisonId={id} cardData={cardData} sides={sides} />;
}
