import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_MODEL = "gemini-2.0-flash";
const MIN_VOTES = 10;
const MIN_COMMENTS = 5;
const COMMENTS_PER_SIDE = 4;

interface OptionRow {
  id: string;
  label: string;
  vote_count: number;
}

interface CommentRow {
  option_id: string;
  body: string;
  like_count: number;
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

    let comparisonId = "";
    let regenerate = false;
    try {
      const body = await req.json();
      comparisonId = typeof body?.comparisonId === "string" ? body.comparisonId : "";
      regenerate = body?.regenerate === true;
    } catch {
      return json({ error: "Expected a JSON body with a `comparisonId` field." }, 400);
    }
    if (!comparisonId) return json({ error: "Missing comparisonId." }, 400);

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

    const { data: comparison } = await supabase
      .from("comparisons")
      .select("id, prompt, vote_count, comment_count, ai_opinion, ai_opinion_generated_at")
      .eq("id", comparisonId)
      .maybeSingle();

    if (!comparison) return json({ error: "Comparison not found." }, 404);

    if (comparison.ai_opinion && !regenerate) {
      return json({ opinion: comparison.ai_opinion, generatedAt: comparison.ai_opinion_generated_at, cached: true });
    }

    if (comparison.vote_count < MIN_VOTES && comparison.comment_count < MIN_COMMENTS) {
      return json({
        opinion: null,
        needsMoreActivity: true,
        message: "This debate needs a bit more activity before there's enough to summarize.",
      });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return json({ error: "GEMINI_API_KEY is not configured for this project yet." }, 500);
    }

    const { data: options } = await supabase
      .from("comparison_options")
      .select("id, label, vote_count")
      .eq("comparison_id", comparisonId)
      .returns<OptionRow[]>();

    const { data: comments } = await supabase
      .from("comments")
      .select("option_id, body, like_count")
      .eq("comparison_id", comparisonId)
      .eq("status", "active")
      .order("like_count", { ascending: false })
      .returns<CommentRow[]>();

    const sideLines = (options ?? [])
      .map((o) => {
        const topComments = (comments ?? [])
          .filter((c) => c.option_id === o.id)
          .slice(0, COMMENTS_PER_SIDE)
          .map((c) => `  - "${c.body.slice(0, 200)}"`)
          .join("\n");
        return `${o.label} (${o.vote_count} votes):\n${topComments || "  (no comments yet)"}`;
      })
      .join("\n\n");

    const prompt = `You are summarizing a debate on "This or That", an app where people vote between options and then discuss why. Read the options, their vote counts, and a sample of top comments from each side below. Write a short, balanced take (3-5 sentences) explaining what each side's supporters tend to emphasize — like "X supporters emphasize durability and price, while Y supporters emphasize design and brand." Be specific and grounded in the comments given; do not invent reasons that aren't reflected in them. If comments are sparse, lean more on general framing but stay honest about the limited evidence.

Question: ${comparison.prompt ?? "(no question text)"}

${sideLines}`;

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
    const opinion: string | undefined = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!opinion) return json({ error: "Gemini returned no opinion." }, 502);

    const trimmedOpinion = opinion.trim().slice(0, 800);
    const generatedAt = new Date().toISOString();

    await supabase
      .from("comparisons")
      .update({ ai_opinion: trimmedOpinion, ai_opinion_generated_at: generatedAt })
      .eq("id", comparisonId);

    return json({ opinion: trimmedOpinion, generatedAt, cached: false });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
