import { createClient } from "@/lib/supabase/server";

/** Deterministic 0-99 bucket for a (userId, key) pair — stable across requests. */
function bucket(userId: string, key: string): number {
  const s = `${userId}:${key}`;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100;
}

/**
 * Server-side rollout gate. Anonymous visitors (no userId) only ever see a
 * flag once it's rolled out to everyone (enabled_pct 100) — there's no
 * stable identity to bucket them on.
 */
export async function isFeatureEnabled(key: string, userId: string | null): Promise<boolean> {
  const supabase = await createClient();
  const { data: flag } = await supabase
    .from("feature_flags")
    .select("enabled_pct, enabled_for")
    .eq("key", key)
    .maybeSingle();

  if (!flag) return false;
  if (userId && flag.enabled_for.includes(userId)) return true;
  if (flag.enabled_pct >= 100) return true;
  if (flag.enabled_pct <= 0) return false;
  if (!userId) return false;

  return bucket(userId, key) < flag.enabled_pct;
}
