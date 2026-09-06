"use server";

import { createClient } from "@/lib/supabase/server";

// Downloads a chosen Unsplash/Pexels photo server-side (Vercel's runtime,
// not the browser - sidesteps any CORS quirks on the photo host) and
// re-uploads it into the user's own comparison-images/<userId>/ path, so
// the result satisfies createComparisonAction's existing anti-hotlinking
// check (it only accepts image_url values already under that prefix)
// instead of weakening that check to allow arbitrary external URLs.
export async function saveStockImageAction(candidateUrl: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await fetch(candidateUrl);
  if (!res.ok) throw new Error("Couldn't download that photo.");
  const blob = await res.blob();

  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("comparison-images")
    .upload(path, blob, { contentType: "image/jpeg" });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("comparison-images").getPublicUrl(path);
  return data.publicUrl;
}
