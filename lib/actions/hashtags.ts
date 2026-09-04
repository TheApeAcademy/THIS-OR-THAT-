"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

/**
 * Upserts each tag into `hashtags` and links it to the comparison. Called
 * right after a comparison is created, from the same authenticated client
 * as the insert (both `hashtags` and `comparison_hashtags` RLS require the
 * caller to be the comparison's creator / a signed-in user).
 */
export async function attachHashtags(
  supabase: SupabaseClient<Database>,
  comparisonId: string,
  tags: string[]
) {
  for (const tag of tags) {
    const { data: existing } = await supabase.from("hashtags").select("id").eq("tag", tag).maybeSingle();

    let hashtagId = existing?.id;
    if (!hashtagId) {
      const { data: created, error: createError } = await supabase
        .from("hashtags")
        .insert({ tag })
        .select("id")
        .single();
      if (createError) {
        if (createError.code === "23505") {
          const { data: retry } = await supabase.from("hashtags").select("id").eq("tag", tag).maybeSingle();
          hashtagId = retry?.id;
        } else {
          throw createError;
        }
      } else {
        hashtagId = created.id;
      }
    }

    if (hashtagId) {
      const { error } = await supabase
        .from("comparison_hashtags")
        .insert({ comparison_id: comparisonId, hashtag_id: hashtagId });
      if (error && error.code !== "23505") throw error;
    }
  }
}

export interface HashtagResult {
  id: string;
  tag: string;
  useCount: number;
}

export async function searchHashtagsAction(query: string): Promise<HashtagResult[]> {
  const trimmed = query.trim().replace(/^#/, "");
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hashtags")
    .select("id, tag, use_count")
    .ilike("tag", `%${trimmed}%`)
    .order("use_count", { ascending: false })
    .limit(8);
  if (error) throw error;

  return (data ?? []).map((h) => ({ id: h.id, tag: h.tag, useCount: h.use_count }));
}
