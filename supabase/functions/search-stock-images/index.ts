import { createClient } from "npm:@supabase/supabase-js@2";

const RESULT_COUNT = 6;

interface Candidate {
  url: string;
  thumbUrl: string;
  attribution: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function searchUnsplash(query: string, key: string): Promise<Candidate[]> {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${RESULT_COUNT}&orientation=squarish`,
    { headers: { Authorization: `Client-ID ${key}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).map((r: Record<string, unknown>) => {
    const urls = r.urls as Record<string, string>;
    const user = r.user as Record<string, string>;
    return { url: urls.regular, thumbUrl: urls.small, attribution: `Photo by ${user.name} on Unsplash` };
  });
}

async function searchPexels(query: string, key: string): Promise<Candidate[]> {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${RESULT_COUNT}`,
    { headers: { Authorization: key } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.photos ?? []).map((p: Record<string, unknown>) => {
    const src = p.src as Record<string, string>;
    return { url: src.large, thumbUrl: src.medium, attribution: `Photo by ${p.photographer} on Pexels` };
  });
}

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    let query = "";
    try {
      const body = await req.json();
      query = typeof body?.query === "string" ? body.query.trim() : "";
    } catch {
      return json({ error: "Expected a JSON body with a `query` field." }, 400);
    }
    if (!query) return json({ error: "Missing query." }, 400);

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

    const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const pexelsKey = Deno.env.get("PEXELS_API_KEY");
    if (!unsplashKey && !pexelsKey) {
      return json({ error: "Neither UNSPLASH_ACCESS_KEY nor PEXELS_API_KEY is configured yet." }, 500);
    }

    let results: Candidate[] = [];
    if (unsplashKey) {
      results = await searchUnsplash(query, unsplashKey).catch(() => []);
    }
    if (results.length === 0 && pexelsKey) {
      results = await searchPexels(query, pexelsKey).catch(() => []);
    }

    return json({ results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
