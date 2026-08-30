import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_MODEL = "gemini-2.0-flash";
const MIN_ANSWERS = 3;

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

    const { data: answers } = await supabase
      .from("profile_answers")
      .select("question_key, answer")
      .eq("user_id", user.id);

    if (!answers || answers.length < MIN_ANSWERS) {
      return json({
        bio: null,
        needsMoreAnswers: true,
        message: `Answer a few more questions to unlock your AI bio (${answers?.length ?? 0}/${MIN_ANSWERS}).`,
      });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return json({ error: "GEMINI_API_KEY is not configured for this project yet." }, 500);
    }

    const qaLines = answers.map((a) => `- ${a.question_key}: ${a.answer}`).join("\n");

    const prompt = `You are writing a short, fun, warm bio for someone's profile card on "This or That", a social app. Based on their answers below, write a 2-3 sentence bio in first person ("I..."), punchy and specific, not generic corporate-speak. No hashtags, no emoji spam (at most one emoji total). Keep it under 240 characters.

Their answers:
${qaLines}`;

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
    const bio: string | undefined = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!bio) return json({ error: "Gemini returned no bio." }, 502);

    const trimmedBio = bio.trim().slice(0, 280);
    const generatedAt = new Date().toISOString();

    await supabase
      .from("profiles")
      .update({ ai_bio: trimmedBio, ai_bio_generated_at: generatedAt })
      .eq("id", user.id);

    return json({ bio: trimmedBio, generatedAt });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
