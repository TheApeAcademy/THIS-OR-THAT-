import { createClient } from "@/lib/supabase/server";
import { type RawComparisonWithOptions } from "@/lib/comparisons";
import { shuffle } from "@/lib/shuffle";
import { PlayDeck } from "@/components/PlayDeck";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myVotes } = user
    ? await supabase.from("votes").select("comparison_id").eq("user_id", user.id)
    : { data: [] };
  const votedIds = new Set((myVotes ?? []).map((v) => v.comparison_id));

  const { data: candidates } = await supabase
    .from("comparisons")
    .select("id, prompt, comparison_options(id, side, label, image_url, vote_count)")
    .eq("status", "active")
    .limit(100)
    .returns<RawComparisonWithOptions[]>();

  const queue = shuffle((candidates ?? []).filter((c) => !votedIds.has(c.id))).slice(0, 20);

  return <PlayDeck comparisons={queue} />;
}
