import { createClient } from "npm:@supabase/supabase-js@2";

const BATCH_LIMIT = 50;

interface OptionRow {
  id: string;
  label: string;
  image_url: string | null;
  comparison_id: string;
  comparisons: { creator_id: string | null } | null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function needsRealPhoto(url: string | null): boolean {
  return !url || url.includes("loremflickr.com");
}

async function findPhotoUrl(query: string, unsplashKey?: string, pexelsKey?: string): Promise<string | null> {
  if (unsplashKey) {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`,
      { headers: { Authorization: `Client-ID ${unsplashKey}` } }
    ).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      const url = data.results?.[0]?.urls?.regular;
      if (url) return url;
    }
  }
  if (pexelsKey) {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: { Authorization: pexelsKey },
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      const url = data.photos?.[0]?.src?.large;
      if (url) return url;
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser();
    if (userError || !user) return json({ error: "Not authenticated" }, 401);

    const { data: profile } = await anonClient.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return json({ error: "Admin only." }, 403);

    const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const pexelsKey = Deno.env.get("PEXELS_API_KEY");
    if (!unsplashKey && !pexelsKey) {
      return json({ error: "Neither UNSPLASH_ACCESS_KEY nor PEXELS_API_KEY is configured yet." }, 500);
    }

    // Service-role client from here on - this touches every user's
    // comparisons, not just the admin's own, and uploads into each
    // option's own creator's storage path.
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: candidates } = await admin
      .from("comparison_options")
      .select("id, label, image_url, comparison_id, comparisons!comparison_options_comparison_id_fkey(creator_id)")
      .or("image_url.is.null,image_url.ilike.%loremflickr.com%")
      .limit(BATCH_LIMIT)
      .returns<OptionRow[]>();

    const rows = (candidates ?? []).filter((r) => needsRealPhoto(r.image_url));
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const creatorId = row.comparisons?.creator_id;
      if (!creatorId) {
        skipped++;
        continue;
      }
      const photoUrl = await findPhotoUrl(row.label, unsplashKey, pexelsKey);
      if (!photoUrl) {
        skipped++;
        continue;
      }
      const imgRes = await fetch(photoUrl).catch(() => null);
      if (!imgRes?.ok) {
        skipped++;
        continue;
      }
      const blob = await imgRes.blob();
      const path = `${creatorId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await admin.storage
        .from("comparison-images")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (uploadError) {
        skipped++;
        continue;
      }
      const { data: pub } = admin.storage.from("comparison-images").getPublicUrl(path);
      await admin.from("comparison_options").update({ image_url: pub.publicUrl }).eq("id", row.id);
      updated++;
    }

    const { count: remaining } = await admin
      .from("comparison_options")
      .select("id", { count: "exact", head: true })
      .or("image_url.is.null,image_url.ilike.%loremflickr.com%");

    return json({ updated, skipped, remaining: remaining ?? 0 });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
