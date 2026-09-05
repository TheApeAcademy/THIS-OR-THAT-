import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_MODEL = "gemini-2.0-flash";
const MAX_PROMPT_LEN = 200;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Runs at Create time, before a comparison exists yet - unlike
// debate-ai-opinion (which summarizes an existing debate's comments),
// this only ever sees the draft prompt/options the user is currently
// typing. Auth is still required (default verify_jwt=true, no config.toml
// entry needed) purely to rate-limit/attribute usage, not because the
// draft itself is tied to any row.
Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    let prompt = "";
    let options: string[] = [];
    try {
      const body = await req.json();
      prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
      options = Array.isArray(body?.options) ? body.options.filter((o: unknown) => typeof o === "string") : [];
    } catch {
      return json({ error: "Expected a JSON body with `prompt` and `options` fields." }, 400);
    }
    if (!prompt) return json({ error: "Missing prompt." }, 400);
    if (options.length < 2) return json({ error: "Need at least 2 options." }, 400);

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

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return json({ error: "GEMINI_API_KEY is not configured for this project yet." }, 500);
    }

    const aiPrompt = `You are helping someone write a debate question for "This or That", an app built around fast, clear A-vs-B (or A-vs-B-vs-C, etc.) choices. Given their draft question and options below, suggest ONE improved, less ambiguous version of the question. Keep it short (under ${MAX_PROMPT_LEN} characters), keep the same options and the same intent - only clarify wording, don't change what's being compared. If the draft is already clear and good, return it unchanged. Respond with ONLY the improved question text, nothing else - no quotes, no explanation.

Draft question: ${prompt}
Options: ${options.join(", ")}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: aiPrompt }] }] }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return json({ error: `Gemini request failed: ${errText}` }, 502);
    }

    const geminiJson = await geminiRes.json();
    const suggestion: string | undefined = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!suggestion) return json({ error: "Gemini returned no suggestion." }, 502);

    const trimmed = suggestion.trim().replace(/^["']|["']$/g, "").slice(0, MAX_PROMPT_LEN);
    return json({ suggestion: trimmed });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
