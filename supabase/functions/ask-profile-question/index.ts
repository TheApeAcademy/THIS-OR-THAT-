import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_MODEL = "gemini-2.0-flash";
const MIN_VOTES = 10;
const MAX_QUESTION_LENGTH = 300;

interface Breakdown {
  [category: string]: { votes: number; pct: number };
}

interface SignalRow {
  label: string;
  wins: number;
  opportunities: number;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    let question = "";
    try {
      const body = await req.json();
      question = typeof body?.question === "string" ? body.question.trim() : "";
    } catch {
      return json({ error: "Expected a JSON body with a `question` field." }, 400);
    }
    if (!question) return json({ error: "Ask a question first." }, 400);
    question = question.slice(0, MAX_QUESTION_LENGTH);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Not authenticated" }, 401);

    const { count: totalVotes } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!totalVotes || totalVotes < MIN_VOTES) {
      return json({
        answer: null,
        needsMoreVotes: true,
        message: "Vote on a few more comparisons to unlock this.",
      });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return json({ error: "GEMINI_API_KEY is not configured for this project yet." }, 500);
    }

    const [{ data: dna }, { data: categories }, { data: signals }] = await Promise.all([
      supabase.from("preference_dna").select("breakdown").eq("user_id", user.id).maybeSingle(),
      supabase.from("categories").select("slug, label"),
      supabase
        .from("preference_signals")
        .select("label, wins, opportunities")
        .eq("user_id", user.id)
        .gte("opportunities", 3)
        .order("opportunities", { ascending: false })
        .limit(15)
        .returns<SignalRow[]>(),
    ]);

    const categoryLabels = new Map((categories ?? []).map((c) => [c.slug, c.label]));
    const breakdown = (dna?.breakdown ?? {}) as Breakdown;
    const breakdownLines = Object.entries(breakdown)
      .sort((a, b) => b[1].pct - a[1].pct)
      .map(([slug, v]) => `- ${categoryLabels.get(slug) ?? slug}: ${v.pct}% of votes (${v.votes} votes)`)
      .join("\n");

    const signalLines = (signals ?? [])
      .map((s) => `- ${s.label}: picked ${s.wins} of ${s.opportunities} times it was an option`)
      .join("\n");

    const prompt = `You are answering a question a user asked about their own activity on "This or That", an app where people vote on two-option comparisons. Answer ONLY using the evidence below — never invent facts, brands, or numbers that aren't in it. If the evidence doesn't cover what they're asking, say so plainly instead of guessing. Keep the answer to 1-4 sentences, in second person ("you"), citing the actual numbers when relevant.

Category breakdown (share of their total votes):
${breakdownLines || "(no category data yet)"}

Specific preferences (evidence: wins out of times offered):
${signalLines || "(no specific preference data yet)"}

Their question: "${question}"`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return json({ error: `Gemini request failed: ${errText}` }, 502);
    }

    const geminiJson = await geminiRes.json();
    const answer: string | undefined = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) return json({ error: "Gemini returned no answer." }, 502);

    return json({ answer: answer.trim().slice(0, 600) });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
