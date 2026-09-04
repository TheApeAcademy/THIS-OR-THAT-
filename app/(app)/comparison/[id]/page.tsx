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
    .select(
      "id, prompt, is_sponsored, sponsor_label, comparison_hashtags(hashtags(tag)), comparison_options(id, side, label, image_url, vote_count, claimed_by, statement, claimant:profiles!comparison_options_claimed_by_fkey(username, avatar_url, profile_photo_url))"
    )
    .eq("id", id)
    .single<RawComparisonWithOptions>();

  if (!comparison) notFound();

  const claimants = comparison.comparison_options.map((o) => o.claimed_by).filter((id): id is string => !!id);
  let rivalry: { winsA: number; winsB: number; ties: number; usernameA: string; usernameB: string } | null = null;
  if (claimants.length === 2) {
    const [{ data: rivalryData }, optionA, optionB] = await Promise.all([
      supabase.rpc("get_duel_record", { p_user_a: claimants[0], p_user_b: claimants[1] }),
      Promise.resolve(comparison.comparison_options.find((o) => o.claimed_by === claimants[0])),
      Promise.resolve(comparison.comparison_options.find((o) => o.claimed_by === claimants[1])),
    ]);
    const row = rivalryData?.[0];
    if (row && optionA?.claimant && optionB?.claimant) {
      rivalry = {
        winsA: row.wins_a,
        winsB: row.wins_b,
        ties: row.ties,
        usernameA: optionA.claimant.username,
        usernameB: optionB.claimant.username,
      };
    }
  }

  const { data: myVote } = await supabase
    .from("votes")
    .select("option_id")
    .eq("comparison_id", id)
    .maybeSingle();

  const cardData = toComparisonCardData(comparison, myVote?.option_id);
  if (!cardData) notFound();

  let sides: SideData[] | null = null;

  if (myVote) {
    const { data: comments } = await supabase
      .from("comments")
      .select("id, body, option_id, parent_comment_id, like_count, created_at, profiles(username, avatar_url, profile_photo_url)")
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

    const orderedOptions = [...comparison.comparison_options].sort((a, b) =>
      a.side.localeCompare(b.side)
    );

    sides = orderedOptions.map((option) => ({
      optionId: option.id,
      label: option.label,
      comments: byOption[option.id] ?? [],
    }));
  }

  return <ComparisonDetail comparisonId={id} cardData={cardData} sides={sides} rivalry={rivalry} />;
}
