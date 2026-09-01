import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DuelChallengeCard, type DuelChallengeSummary } from "@/components/DuelChallengeCard";

export const dynamic = "force-dynamic";

interface RawDuelChallenge {
  id: string;
  prompt: string | null;
  challenger_label: string;
  challenger_statement: string | null;
  target_user_id: string | null;
  challenger: { username: string; avatar_url: string | null; profile_photo_url: string | null } | null;
}

function toSummary(row: RawDuelChallenge): DuelChallengeSummary | null {
  if (!row.challenger) return null;
  return {
    id: row.id,
    prompt: row.prompt,
    challengerLabel: row.challenger_label,
    challengerStatement: row.challenger_statement,
    isDirect: row.target_user_id !== null,
    challenger: {
      username: row.challenger.username,
      avatarUrl: row.challenger.profile_photo_url ?? row.challenger.avatar_url,
    },
  };
}

export default async function DuelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const SELECT =
    "id, prompt, challenger_label, challenger_statement, target_user_id, challenger:profiles!duel_challenges_challenger_id_fkey(username, avatar_url, profile_photo_url)";

  const [{ data: forYouRaw }, { data: openRaw }] = await Promise.all([
    supabase
      .from("duel_challenges")
      .select(SELECT)
      .eq("target_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .returns<RawDuelChallenge[]>(),
    supabase
      .from("duel_challenges")
      .select(SELECT)
      .is("target_user_id", null)
      .eq("status", "pending")
      .neq("challenger_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<RawDuelChallenge[]>(),
  ]);

  const forYou = (forYouRaw ?? []).map(toSummary).filter((c) => c !== null);
  const open = (openRaw ?? []).map(toSummary).filter((c) => c !== null);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <h1 className="text-2xl font-bold text-text-primary">Duels</h1>

      {forYou.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-text-secondary">Challenges for you</p>
          {forYou.map((c) => (
            <DuelChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-semibold text-text-secondary">Open Duels</p>
        {open.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-secondary">No open duels right now — start one from Create.</p>
        ) : (
          open.map((c) => <DuelChallengeCard key={c.id} challenge={c} />)
        )}
      </div>
    </div>
  );
}
