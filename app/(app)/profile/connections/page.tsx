import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConnectionRow } from "@/components/ConnectionRow";
import { computeEffectiveVisibility, type CardAccessRule } from "@/lib/cardAccess";

export const dynamic = "force-dynamic";

interface ViewRow {
  viewer_id: string | null;
  created_at: string;
  profiles: { username: string; display_name: string | null; profile_photo_url: string | null; avatar_url: string | null } | null;
}

type RuleRow = CardAccessRule & { viewer_id: string };

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: views }, { data: rules }, { data: followers }] = await Promise.all([
    supabase
      .from("profiles")
      .select("show_dna, show_play_score, show_streak, show_avatar_3d, show_zodiac, show_bio")
      .eq("id", user.id)
      .single(),
    supabase
      .from("card_views")
      .select("viewer_id, created_at, profiles!card_views_viewer_id_fkey(username, display_name, profile_photo_url, avatar_url)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<ViewRow[]>(),
    supabase
      .from("card_access_rules")
      .select("viewer_id, show_dna, show_play_score, show_streak, show_avatar_3d, show_zodiac, show_bio, blocked")
      .eq("owner_id", user.id),
    supabase
      .from("follows")
      .select("follower_id, profiles!follows_follower_id_fkey(username, display_name, profile_photo_url, avatar_url)")
      .eq("followee_id", user.id),
  ]);

  const defaults = {
    showDna: profile?.show_dna ?? true,
    showPlayScore: profile?.show_play_score ?? true,
    showStreak: profile?.show_streak ?? true,
    showAvatar3d: profile?.show_avatar_3d ?? true,
    showZodiac: profile?.show_zodiac ?? true,
    showBio: profile?.show_bio ?? true,
  };

  const ruleMap = new Map((rules ?? []).map((r) => [(r as RuleRow).viewer_id, r as RuleRow]));

  type Entry = {
    viewerId: string;
    username: string;
    avatarUrl: string | null;
    viewCount: number;
    lastViewedAt: string | null;
    followsYou: boolean;
  };
  const entries = new Map<string, Entry>();
  let anonymousViews = 0;

  for (const v of views ?? []) {
    if (!v.viewer_id || !v.profiles) {
      if (!v.viewer_id) anonymousViews++;
      continue;
    }
    const existing = entries.get(v.viewer_id);
    if (existing) {
      existing.viewCount++;
    } else {
      entries.set(v.viewer_id, {
        viewerId: v.viewer_id,
        username: v.profiles.username,
        avatarUrl: v.profiles.profile_photo_url ?? v.profiles.avatar_url,
        viewCount: 1,
        lastViewedAt: v.created_at,
        followsYou: false,
      });
    }
  }

  for (const f of followers ?? []) {
    if (!f.profiles) continue;
    const existing = entries.get(f.follower_id);
    if (existing) {
      existing.followsYou = true;
    } else {
      entries.set(f.follower_id, {
        viewerId: f.follower_id,
        username: f.profiles.username,
        avatarUrl: f.profiles.profile_photo_url ?? f.profiles.avatar_url,
        viewCount: 0,
        lastViewedAt: null,
        followsYou: true,
      });
    }
  }

  const list = [...entries.values()].sort((a, b) => {
    if (!!a.lastViewedAt !== !!b.lastViewedAt) return a.lastViewedAt ? -1 : 1;
    return (b.lastViewedAt ?? "").localeCompare(a.lastViewedAt ?? "");
  });

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      <div>
        <p className="text-lg font-semibold text-text-primary">Connections</p>
        <p className="text-sm text-text-secondary">
          Everyone who has viewed or follows your card, and what they can see.
          {anonymousViews > 0 ? ` Plus ${anonymousViews} anonymous view${anonymousViews === 1 ? "" : "s"}.` : ""}
        </p>
      </div>

      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">No one has viewed or followed your card yet.</p>
      ) : (
        <div className="space-y-1">
          {list.map((entry) => (
            <ConnectionRow
              key={entry.viewerId}
              viewerId={entry.viewerId}
              username={entry.username}
              avatarUrl={entry.avatarUrl}
              viewCount={entry.viewCount}
              lastViewedAt={entry.lastViewedAt}
              followsYou={entry.followsYou}
              effective={computeEffectiveVisibility(defaults, ruleMap.get(entry.viewerId) ?? null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
