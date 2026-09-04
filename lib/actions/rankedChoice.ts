"use server";

import { createClient } from "@/lib/supabase/server";
import { computeInstantRunoff, type Ballot, type RunoffRound } from "@/lib/instantRunoff";

export async function submitRankedVoteAction(comparisonId: string, rankedOptionIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("submit_ranked_vote", {
    p_comparison_id: comparisonId,
    p_ranked_option_ids: rankedOptionIds,
  });
  if (error) throw error;
}

export interface RankedChoiceLabeledRound {
  round: number;
  counts: { optionId: string; label: string; votes: number; eliminated: boolean }[];
  winnerOptionId: string | null;
}

export async function getRankedChoiceResultAction(
  comparisonId: string
): Promise<RankedChoiceLabeledRound[]> {
  const supabase = await createClient();

  const [{ data: ballotRows }, { data: options }] = await Promise.all([
    supabase.rpc("get_ranked_ballots", { p_comparison_id: comparisonId }),
    supabase.from("comparison_options").select("id, label").eq("comparison_id", comparisonId),
  ]);

  const labelById = new Map((options ?? []).map((o) => [o.id, o.label]));
  const ballots: Ballot[] = (ballotRows ?? []).map((r) => ({
    voterSeq: r.voter_seq,
    optionId: r.option_id,
    rank: r.rank,
  }));

  const rounds: RunoffRound[] = computeInstantRunoff(ballots);

  return rounds.map((r) => ({
    round: r.round,
    winnerOptionId: r.winnerOptionId,
    counts: r.counts.map((c) => ({
      optionId: c.optionId,
      label: labelById.get(c.optionId) ?? "Unknown",
      votes: c.votes,
      eliminated: c.eliminated,
    })),
  }));
}
