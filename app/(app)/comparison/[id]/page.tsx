import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { buildCommentTree, type FlatComment } from "@/lib/commentTree";
import { ComparisonDetail } from "@/components/ComparisonDetail";
import { getRankedChoiceResultAction } from "@/lib/actions/rankedChoice";
import type { SideData } from "@/components/SideSplitComments";
import type { GlobalPulseRow } from "@/components/GlobalPulse";
import type { InsightsData } from "@/components/CreatorInsights";

export const dynamic = "force-dynamic";

const EMPTY_ID = "00000000-0000-0000-0000-000000000000";

interface RawComparisonDetailRow extends RawComparisonWithOptions {
  creator_id: string | null;
  ai_opinion: string | null;
  post_type: string;
}

export default async function ComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: comparison }, { data: me }] = await Promise.all([
    supabase
      .from("comparisons")
      .select(
        "id, prompt, creator_id, view_count, ai_opinion, post_type, is_sponsored, sponsor_label, comparison_hashtags(hashtags(tag)), comparison_options!comparison_options_comparison_id_fkey(id, side, label, image_url, vote_count, claimed_by, statement, claimant:profiles!comparison_options_claimed_by_fkey(username, avatar_url, profile_photo_url))"
      )
      .eq("id", id)
      .single<RawComparisonDetailRow>(),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);

  if (!comparison) notFound();
  const isAdmin = me?.is_admin ?? false;

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

  const [{ data: myVote }, { data: pulseRows }, { data: rankedVote }] = await Promise.all([
    supabase.from("votes").select("option_id").eq("comparison_id", id).maybeSingle(),
    supabase.rpc("get_global_pulse", { p_comparison_id: id }),
    comparison.post_type === "ranked_choice"
      ? supabase.from("vote_rankings").select("rank").eq("comparison_id", id).eq("user_id", user.id).limit(1)
      : Promise.resolve({ data: null }),
  ]);

  const cardData = toComparisonCardData(comparison, myVote?.option_id);
  if (!cardData) notFound();

  const hasRanked = !!rankedVote && rankedVote.length > 0;
  const rankedResults =
    comparison.post_type === "ranked_choice" && hasRanked ? await getRankedChoiceResultAction(id) : [];

  const insights: InsightsData | null =
    comparison.creator_id === user.id
      ? {
          viewCount: comparison.view_count ?? 0,
          dailyVotes: ((await supabase.rpc("get_comparison_insights", { p_comparison_id: id })).data ?? []).map(
            (r) => ({ day: r.day, votes: r.votes })
          ),
        }
      : null;

  let sides: SideData[] | null = null;

  if (myVote) {
    const { data: comments } = await supabase
      .from("comments")
      .select(
        "id, body, option_id, parent_comment_id, like_count, helpful_count, funny_count, convincing_count, created_at, edited_at, user_id, profiles(username, avatar_url, profile_photo_url)"
      )
      .eq("comparison_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .returns<FlatComment[]>();

    const commentIds = (comments ?? []).map((c) => c.id);
    const [{ data: likedRows }, { data: reactionRows }] = await Promise.all([
      supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", commentIds.length > 0 ? commentIds : [EMPTY_ID]),
      supabase
        .from("comment_reactions")
        .select("comment_id, type")
        .eq("user_id", user.id)
        .in("comment_id", commentIds.length > 0 ? commentIds : [EMPTY_ID]),
    ]);

    const likedIds = new Set((likedRows ?? []).map((r) => r.comment_id));
    const myReactionsByComment = new Map<string, Set<string>>();
    for (const r of reactionRows ?? []) {
      const set = myReactionsByComment.get(r.comment_id) ?? new Set<string>();
      set.add(r.type);
      myReactionsByComment.set(r.comment_id, set);
    }
    const byOption = buildCommentTree(comments ?? [], likedIds, myReactionsByComment);

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
      rivalry={rivalry}
      isAdmin={isAdmin}
      isSponsored={comparison.is_sponsored ?? false}
      sponsorLabel={comparison.sponsor_label ?? null}
      initialAiOpinion={comparison.ai_opinion}
      globalPulse={(pulseRows ?? []) as GlobalPulseRow[]}
      insights={insights}
      postType={comparison.post_type}
      hasRanked={hasRanked}
      rankedResults={rankedResults}
    />
  );
}
