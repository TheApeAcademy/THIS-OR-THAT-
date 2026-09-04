import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { buildCommentTree, type FlatComment } from "@/lib/commentTree";
import { getHiddenAuthorIds } from "@/lib/blocks";
import { getMutedWords, containsMutedWord } from "@/lib/mutedWords";
import { ComparisonDetail } from "@/components/ComparisonDetail";
import type { SideData } from "@/components/SideSplitComments";
import type { GlobalPulseRow } from "@/components/GlobalPulse";

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
    .select("username, is_admin")
    .eq("id", user.id)
    .single();

  const { data: comparison } = await supabase
    .from("comparisons")
    .select(
      "id, prompt, ai_opinion, is_sponsored, sponsor_label, creator_id, view_count, comparison_options(id, side, label, image_url, vote_count)"
    )
    .eq("id", id)
    .single<
      RawComparisonWithOptions & {
        ai_opinion: string | null;
        is_sponsored: boolean;
        sponsor_label: string | null;
        creator_id: string | null;
        view_count: number;
      }
    >();

  if (!comparison) notFound();

  const isCreator = comparison.creator_id === user.id;

  // Best-effort — never lets a view-tracking hiccup break the page. Only
  // counts visits from people other than the creator, same as the card
  // page's own view counter.
  await supabase.rpc("record_recently_viewed", { p_comparison_id: id }).then(
    () => {},
    () => {}
  );
  if (!isCreator) {
    await supabase.rpc("increment_comparison_view", { p_comparison_id: id }).then(
      () => {},
      () => {}
    );
  }

  const [
    { data: myVote },
    { data: hashtagRows },
    { data: savedRow },
    { data: voteChangeCountRaw },
  ] = await Promise.all([
    supabase.from("votes").select("option_id").eq("comparison_id", id).maybeSingle(),
    supabase
      .from("comparison_hashtags")
      .select("hashtags(tag)")
      .eq("comparison_id", id)
      .returns<{ hashtags: { tag: string } | null }[]>(),
    supabase
      .from("saved_comparisons")
      .select("comparison_id")
      .eq("comparison_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.rpc("get_vote_change_count", { p_comparison_id: id }),
  ]);

  const hashtags = (hashtagRows ?? [])
    .map((r) => r.hashtags?.tag)
    .filter((t): t is string => !!t);
  const voteChangeCount = voteChangeCountRaw ?? 0;

  const { data: insightRows } = isCreator
    ? await supabase.rpc("get_comparison_insights", { p_comparison_id: id })
    : { data: null };

  const cardData = toComparisonCardData(comparison, myVote?.option_id);
  if (!cardData) notFound();
  cardData.hashtags = hashtags;

  let sides: SideData[] | null = null;
  let globalPulse: GlobalPulseRow[] = [];

  if (myVote) {
    const [{ data: comments }, hiddenAuthorIds, { data: pulseRows }, mutedWords] = await Promise.all([
      supabase
        .from("comments")
        .select(
          "id, body, option_id, parent_comment_id, like_count, helpful_count, funny_count, convincing_count, created_at, edited_at, user_id, profiles(username, avatar_url)"
        )
        .eq("comparison_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .returns<FlatComment[]>(),
      getHiddenAuthorIds(supabase, user.id),
      supabase.rpc("get_global_pulse", { p_comparison_id: id }),
      getMutedWords(supabase, user.id),
    ]);
    globalPulse = pulseRows ?? [];

    const hiddenAuthors = new Set(hiddenAuthorIds);
    const visibleComments = (comments ?? []).filter(
      (c) => !hiddenAuthors.has(c.user_id) && !containsMutedWord(c.body, mutedWords)
    );

    const commentIds = visibleComments.map((c) => c.id);
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
    const byOption = buildCommentTree(visibleComments, likedIds, myReactionsByComment);

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
      isAdmin={!!viewerProfile?.is_admin}
      isSponsored={comparison.is_sponsored}
      sponsorLabel={comparison.sponsor_label}
      globalPulse={globalPulse}
      pulseOptions={comparison.comparison_options.map((o) => ({ id: o.id, label: o.label }))}
      voteChangeCount={voteChangeCount}
      savedByMe={!!savedRow}
      insights={
        isCreator
          ? { viewCount: comparison.view_count, dailyVotes: insightRows ?? [] }
          : null
      }
    />
  );
}
