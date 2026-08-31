import { createClient } from "@/lib/supabase/server";
import { toPlayCardData, PLAY_SUBJECTS, type RawPlayComparison } from "@/lib/playFeed";
import { shuffle } from "@/lib/shuffle";
import { PlayFeed } from "@/components/PlayFeed";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";

export const dynamic = "force-dynamic";

const QUEUE_SIZE = 20;

type Mode = "trivia" | "classic" | "leaderboard";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; subject?: string }>;
}) {
  const { mode: rawMode, subject: rawSubject } = await searchParams;
  const mode: Mode = rawMode === "classic" ? "classic" : rawMode === "leaderboard" ? "leaderboard" : "trivia";
  const subject = rawSubject && rawSubject !== "all" ? rawSubject : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: triviaCategory } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "trivia")
    .single();

  // Subject counts across all trivia comparisons — needed by both the play
  // queue's subject switcher and the leaderboard's subject switcher.
  const { data: allTriviaSubjects } = await supabase
    .from("comparisons")
    .select("subject")
    .eq("category_id", triviaCategory?.id ?? "")
    .eq("status", "active");
  const subjectCountMap = new Map<string, number>();
  for (const row of allTriviaSubjects ?? []) {
    if (!row.subject) continue;
    subjectCountMap.set(row.subject, (subjectCountMap.get(row.subject) ?? 0) + 1);
  }
  const subjects = PLAY_SUBJECTS.map((s) => ({ ...s, count: subjectCountMap.get(s.slug) ?? 0 })).filter(
    (s) => s.count > 0
  );

  if (mode === "leaderboard") {
    const { data: rows } = await supabase.rpc("get_leaderboard", {
      p_subject: subject ?? undefined,
      p_limit: 20,
    });
    return <LeaderboardPanel subject={subject} subjects={subjects} rows={rows ?? []} viewerId={user?.id ?? null} />;
  }

  let query = supabase
    .from("comparisons")
    .select("id, prompt, fun_fact, subject, correct_side, comparison_options(id, side, label, image_url, vote_count)")
    .eq("status", "active")
    .limit(200);

  if (mode === "trivia") {
    query = query.eq("category_id", triviaCategory?.id ?? "");
    if (subject) query = query.eq("subject", subject);
  } else {
    query = query.neq("category_id", triviaCategory?.id ?? "");
  }

  const { data: comparisons } = await query.returns<RawPlayComparison[]>();

  // Scoped to this page's candidate comparisons rather than the user's
  // entire vote history, which would otherwise grow unbounded as they vote.
  const candidateIds = (comparisons ?? []).map((c) => c.id);
  const { data: myVotes } =
    user && candidateIds.length > 0
      ? await supabase.from("votes").select("comparison_id").eq("user_id", user.id).in("comparison_id", candidateIds)
      : { data: [] };
  const votedIds = new Set((myVotes ?? []).map((v) => v.comparison_id));

  const queue = shuffle(
    (comparisons ?? [])
      .filter((c) => !votedIds.has(c.id))
      .map(toPlayCardData)
      .filter((c) => c !== null)
  ).slice(0, QUEUE_SIZE);

  let myStats: { subject: string; correct: number; total: number }[] = [];
  if (user) {
    const { data } = await supabase.from("play_stats").select("subject, correct, total").eq("user_id", user.id);
    myStats = data ?? [];
  }
  const overallCorrect = myStats.reduce((sum, s) => sum + s.correct, 0);
  const overallTotal = myStats.reduce((sum, s) => sum + s.total, 0);
  const subjectStat = subject ? myStats.find((s) => s.subject === subject) : null;

  return (
    <PlayFeed
      key={`${mode}-${subject ?? "all"}`}
      queue={queue}
      mode={mode}
      subject={subject}
      subjects={subjects}
      score={{
        correct: subjectStat?.correct ?? overallCorrect,
        total: subjectStat?.total ?? overallTotal,
      }}
      isAuthed={!!user}
    />
  );
}
