import { createClient } from "@/lib/supabase/server";
import { toPlayCardData, PLAY_SUBJECTS, type RawPlayComparison } from "@/lib/playFeed";
import { shuffle } from "@/lib/shuffle";
import { PlayFeed } from "@/components/PlayFeed";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";

export const dynamic = "force-dynamic";

const QUEUE_SIZE = 20;
const PREDICT_MIN_VOTES = 15;

type Mode = "trivia" | "classic" | "predict" | "leaderboard";
type LeaderboardScope = "global" | "country" | "friends";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; subject?: string; scope?: string }>;
}) {
  const { mode: rawMode, subject: rawSubject, scope: rawScope } = await searchParams;
  const mode: Mode =
    rawMode === "classic"
      ? "classic"
      : rawMode === "predict"
        ? "predict"
        : rawMode === "leaderboard"
          ? "leaderboard"
          : "trivia";
  const subject = rawSubject && rawSubject !== "all" ? rawSubject : null;
  const scope: LeaderboardScope =
    rawScope === "country" ? "country" : rawScope === "friends" ? "friends" : "global";

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
    const { data: viewerProfile } = user
      ? await supabase.from("profiles").select("country").eq("id", user.id).single()
      : { data: null };

    const { data: rows } = await supabase.rpc("get_leaderboard", {
      p_subject: subject ?? undefined,
      p_limit: 20,
      p_country: scope === "country" ? viewerProfile?.country ?? undefined : undefined,
      p_friends_of: scope === "friends" ? user?.id ?? undefined : undefined,
    });
    return (
      <LeaderboardPanel
        subject={subject}
        subjects={subjects}
        rows={rows ?? []}
        viewerId={user?.id ?? null}
        scope={scope}
        hasCountry={!!viewerProfile?.country}
      />
    );
  }

  const { data: myVotes } = user
    ? await supabase.from("votes").select("comparison_id")
    : { data: [] };
  const votedIds = new Set((myVotes ?? []).map((v) => v.comparison_id));

  const { data: myPredictions } =
    user && mode === "predict"
      ? await supabase.from("predictions").select("comparison_id").eq("user_id", user.id)
      : { data: [] };
  const predictedIds = new Set((myPredictions ?? []).map((p) => p.comparison_id));

  let query = supabase
    .from("comparisons")
    .select("id, prompt, fun_fact, subject, correct_side, comparison_options(id, side, label, image_url, vote_count)")
    .eq("status", "active")
    .limit(200);

  if (mode === "trivia") {
    query = query.eq("category_id", triviaCategory?.id ?? "");
    if (subject) query = query.eq("subject", subject);
  } else if (mode === "predict") {
    query = query.neq("category_id", triviaCategory?.id ?? "").gte("vote_count", PREDICT_MIN_VOTES);
  } else {
    query = query.neq("category_id", triviaCategory?.id ?? "");
  }

  const { data: comparisons } = await query.returns<RawPlayComparison[]>();

  const excludedIds = mode === "predict" ? predictedIds : votedIds;
  const queue = shuffle(
    (comparisons ?? [])
      .filter((c) => !excludedIds.has(c.id))
      .map(toPlayCardData)
      .filter((c) => c !== null)
  ).slice(0, QUEUE_SIZE);

  let myStats: { subject: string; correct: number; total: number }[] = [];
  let profileStreaks = { play_streak: 0, play_best_streak: 0 };
  if (user) {
    const [{ data: statsData }, { data: profileData }] = await Promise.all([
      supabase.from("play_stats").select("subject, correct, total").eq("user_id", user.id),
      supabase.from("profiles").select("play_streak, play_best_streak").eq("id", user.id).single(),
    ]);
    myStats = statsData ?? [];
    if (profileData) profileStreaks = profileData;
  }
  const overallCorrect = myStats.reduce((sum, s) => sum + s.correct, 0);
  const overallTotal = myStats.reduce((sum, s) => sum + s.total, 0);
  const subjectStat = subject ? myStats.find((s) => s.subject === subject) : null;

  let predictScore = { correct: 0, total: 0 };
  if (user && mode === "predict") {
    const { data: predictionRows } = await supabase.from("predictions").select("correct").eq("user_id", user.id);
    predictScore = {
      correct: (predictionRows ?? []).filter((p) => p.correct).length,
      total: (predictionRows ?? []).length,
    };
  }

  return (
    <PlayFeed
      key={`${mode}-${subject ?? "all"}`}
      queue={queue}
      mode={mode}
      subject={subject}
      subjects={subjects}
      score={
        mode === "predict"
          ? predictScore
          : {
              correct: subjectStat?.correct ?? overallCorrect,
              total: subjectStat?.total ?? overallTotal,
            }
      }
      isAuthed={!!user}
      initialStreak={profileStreaks.play_streak}
      initialBestStreak={profileStreaks.play_best_streak}
    />
  );
}
