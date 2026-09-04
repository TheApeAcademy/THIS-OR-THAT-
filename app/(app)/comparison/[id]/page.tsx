import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { buildCommentTree, type FlatComment } from "@/lib/commentTree";
import { getHiddenAuthorIds } from "@/lib/blocks";
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
      "id, prompt, ai_opinion, is_sponsored, sponsor_label, comparison_options(id, side, label, image_url, vote_count)"
    )
    .eq("id", id)
    .single<
      RawComparisonWithOptions & {
        ai_opinion: string | null;
        is_sponsored: boolean;
        sponsor_label: string | null;
      }
    >();

  if (!comparison) notFound();

  const { data: myVote } = await supabase
    .from("votes")
    .select("option_id")
    .eq("comparison_id", id)
    .maybeSingle();

  const cardData = toComparisonCardData(comparison, myVote?.option_id);
  if (!cardData) notFound();

  let sides: SideData[] | null = null;
  let globalPulse: GlobalPulseRow[] = [];

  if (myVote) {
    const [{ data: comments }, hiddenAuthorIds, { data: pulseRows }] = await Promise.all([
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
      supabase.rpc("get_global_pulse", { p_comparison_id: id }),
    ]);
    globalPulse = pulseRows ?? [];

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
      isAdmin={!!viewerProfile?.is_admin}
      isSponsored={comparison.is_sponsored}
      sponsorLabel={comparison.sponsor_label}
      globalPulse={globalPulse}
      pulseOptions={comparison.comparison_options.map((o) => ({ id: o.id, label: o.label }))}
    />
  );
}
