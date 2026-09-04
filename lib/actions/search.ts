"use server";

import { createClient } from "@/lib/supabase/server";
import { getHiddenAuthorIds } from "@/lib/blocks";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import type { ComparisonCardData } from "@/components/ComparisonCard";

export interface TopicSearchResult {
  id: string;
  slug: string;
  label: string;
  followerCount: number;
  followedByMe: boolean;
}

interface SearchRow extends RawComparisonWithOptions {
  vote_count: number;
  creator_id: string | null;
}

export async function searchComparisonsAction(query: string): Promise<ComparisonCardData[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Best-effort — a logging hiccup shouldn't break search itself.
    await supabase.from("search_history").insert({ user_id: user.id, query: trimmed });
  }

  const select =
    "id, prompt, vote_count, creator_id, comparison_options(id, side, label, image_url, vote_count)";

  // Two separate ilike queries instead of a single .or() filter — the
  // search term is arbitrary user input and PostgREST's .or() syntax
  // treats commas/parentheses as filter-grammar characters, not literal
  // text, so interpolating it there would be fragile.
  const [{ data: byPrompt, error: promptError }, { data: byCaption, error: captionError }] = await Promise.all([
    supabase
      .from("comparisons")
      .select(select)
      .eq("status", "active")
      .ilike("prompt", `%${trimmed}%`)
      .order("vote_count", { ascending: false })
      .limit(10)
      .returns<SearchRow[]>(),
    supabase
      .from("comparisons")
      .select(select)
      .eq("status", "active")
      .ilike("caption", `%${trimmed}%`)
      .order("vote_count", { ascending: false })
      .limit(10)
      .returns<SearchRow[]>(),
  ]);

  if (promptError) throw promptError;
  if (captionError) throw captionError;

  const hiddenAuthorIds = user ? new Set(await getHiddenAuthorIds(supabase, user.id)) : new Set<string>();

  const merged = new Map<string, SearchRow>();
  for (const c of [...(byPrompt ?? []), ...(byCaption ?? [])]) {
    if (c.creator_id && hiddenAuthorIds.has(c.creator_id)) continue;
    merged.set(c.id, c);
  }

  const rows = [...merged.values()].sort((a, b) => b.vote_count - a.vote_count).slice(0, 10);
  const ids = rows.map((r) => r.id);

  const { data: myVotes } = user
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", ids)
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  return rows
    .map((r) => toComparisonCardData(r, votedByComparison.get(r.id)))
    .filter((c): c is ComparisonCardData => c !== null);
}

export async function searchTopicsAction(query: string): Promise<TopicSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("topics")
    .select("id, slug, label, follower_count")
    .ilike("label", `%${trimmed}%`)
    .order("follower_count", { ascending: false })
    .limit(8);

  if (error) throw error;

  const topicIds = (data ?? []).map((t) => t.id);
  const { data: myFollows } = user
    ? await supabase.from("topic_follows").select("topic_id").eq("user_id", user.id).in("topic_id", topicIds)
    : { data: [] };
  const followedSet = new Set((myFollows ?? []).map((f) => f.topic_id));

  return (data ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    label: t.label,
    followerCount: t.follower_count,
    followedByMe: followedSet.has(t.id),
  }));
}

export async function getSearchHistoryAction(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("search_history")
    .select("query")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // De-dupe while preserving most-recent-first order, capped at 8 chips.
  const seen = new Set<string>();
  const recent: string[] = [];
  for (const row of data ?? []) {
    const q = row.query.trim();
    if (!q || seen.has(q.toLowerCase())) continue;
    seen.add(q.toLowerCase());
    recent.push(q);
    if (recent.length >= 8) break;
  }
  return recent;
}

export async function clearSearchHistoryAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("search_history").delete().eq("user_id", user.id);
  if (error) throw error;
}
