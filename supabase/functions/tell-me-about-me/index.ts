import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_MODEL = "gemini-2.0-flash";
const MIN_VOTES = 10;
const CACHE_WINDOW_MS = 24 * 60 * 60 * 1000;

interface Breakdown {
  [category: string]: { votes: number; pct: number };
}

interface RecentVoteRow {
  option_id: string;
  comparisons: { comparison_options: { id: string; label: string }[] } | null;
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
        summary: null,
        needsMoreVotes: true,
        message: "Vote on a few more comparisons to unlock your summary.",
      });
    }

    const { data: card } = await supabase
      .from("cards")
      .select("id, ai_summary, ai_summary_generated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (card?.ai_summary && card.ai_summary_generated_at) {
      const ageMs = Date.now() - new Date(card.ai_summary_generated_at).getTime();
      if (ageMs < CACHE_WINDOW_MS) {
        return json({ summary: card.ai_summary, generatedAt: card.ai_summary_generated_at, cached: true });
      }
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return json({ error: "GEMINI_API_KEY is not configured for this project yet." }, 500);
    }

    const [{ data: dna }, { data: categories }, { data: recentVotes }] = await Promise.all([
      supabase.from("preference_dna").select("breakdown").eq("user_id", user.id).maybeSingle(),
      supabase.from("categories").select("slug, label"),
      supabase
        .from("votes")
        .select("option_id, comparisons(comparison_options(id, label))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6)
        .returns<RecentVoteRow[]>(),
    ]);

    const categoryLabels = new Map((categories ?? []).map((c) => [c.slug, c.label]));
    const breakdown = (dna?.breakdown ?? {}) as Breakdown;
    const breakdownLines = Object.entries(breakdown)
      .sort((a, b) => b[1].pct - a[1].pct)
      .map(([slug, v]) => `- ${categoryLabels.get(slug) ?? slug}: ${v.pct}% of votes (${v.votes} votes)`)
      .join("\n");

    const picks = (recentVotes ?? [])
      .map((v) => v.comparisons?.comparison_options.find((o) => o.id === v.option_id)?.label)
      .filter((label): label is string => !!label);

    const prompt = `You are writing a short, fun, personality-style summary for a user of "This or That", an app where people vote on two-option comparisons. Based on their voting pattern below, write a 2-4 sentence, warm, specific, non-generic summary of their preferences. Avoid cliches. Do not just restate percentages as numbers; speak naturally.

Category breakdown (share of their total votes):
${breakdownLines}

Some things they've recently chosen: ${picks.join(", ")}`;

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
    const summary: string | undefined = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!summary) return json({ error: "Gemini returned no summary." }, 502);

    const generatedAt = new Date().toISOString();

    if (card) {
      await supabase
        .from("cards")
        .update({ ai_summary: summary, ai_summary_generated_at: generatedAt })
        .eq("id", card.id);
    } else {
      await supabase
        .from("cards")
        .insert({ user_id: user.id, ai_summary: summary, ai_summary_generated_at: generatedAt });
    }

    return json({ summary, generatedAt, cached: false });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
