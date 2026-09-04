import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DnaBreakdown, type DnaRow } from "@/components/DnaBreakdown";
import { RecentPicks, type PickRow } from "@/components/RecentPicks";
import { TellMeAboutMe } from "@/components/TellMeAboutMe";
import { AskProfileQuestion } from "@/components/AskProfileQuestion";
import { AvatarPicker } from "@/components/AvatarPicker";
import { PersonalDetailsFlow } from "@/components/PersonalDetailsFlow";
import { WardrobeShelf, type WardrobeItemRow } from "@/components/WardrobeShelf";
import { TopPreferences, type PreferenceSignalRow } from "@/components/TopPreferences";
import { AchievementBadges } from "@/components/AchievementBadges";
import type { WardrobeSlot } from "@/lib/actions/wardrobe";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface VoteWithComparison {
  comparison_id: string;
  option_id: string;
  comparisons: { comparison_options: { id: string; label: string }[] } | null;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: dna },
    { count: totalVotes },
    { data: categories },
    { data: recentVotes },
    { data: card },
    { data: answerRows },
    { data: wardrobeItems },
    { data: ownedWardrobe },
    { data: outfitRows },
    { data: signalRows },
    { data: achievementRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "username, display_name, avatar_url, is_admin, ai_bio, current_streak, longest_streak, reputation, follower_count, following_count"
      )
      .eq("id", user.id)
      .single(),
    supabase.from("preference_dna").select("breakdown").eq("user_id", user.id).maybeSingle(),
    supabase.from("votes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("categories").select("id, slug, label, emoji"),
    supabase
      .from("votes")
      .select("comparison_id, option_id, comparisons(comparison_options(id, label))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<VoteWithComparison[]>(),
    supabase.from("cards").select("ai_summary").eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_answers").select("question_key, answer").eq("user_id", user.id),
    supabase.from("wardrobe_items").select("id, slot, name, asset_url, price_cents, drop_expires_at").order("z_index"),
    supabase.from("user_wardrobe").select("item_id").eq("user_id", user.id),
    supabase.from("user_outfit").select("slot, item_id").eq("user_id", user.id),
    supabase
      .from("preference_signals")
      .select("label, category_id, wins, opportunities")
      .eq("user_id", user.id)
      .gte("opportunities", 3)
      .order("opportunities", { ascending: false })
      .limit(6),
    supabase.from("achievements").select("type").eq("user_id", user.id),
  ]);

  const categoryMeta = new Map((categories ?? []).map((c) => [c.slug, c]));
  const categoryMetaById = new Map((categories ?? []).map((c) => [c.id, c]));
  const breakdown = (dna?.breakdown ?? {}) as Record<string, { votes: number; pct: number }>;

  const preferenceSignals: PreferenceSignalRow[] = (signalRows ?? []).map((s) => ({
    label: s.label,
    wins: s.wins,
    opportunities: s.opportunities,
    categoryLabel: s.category_id ? categoryMetaById.get(s.category_id)?.label ?? null : null,
    categoryEmoji: s.category_id ? categoryMetaById.get(s.category_id)?.emoji ?? null : null,
  }));

  const rows: DnaRow[] = Object.entries(breakdown)
    .map(([slug, value]) => ({
      slug,
      label: categoryMeta.get(slug)?.label ?? slug,
      emoji: categoryMeta.get(slug)?.emoji ?? null,
      pct: value.pct,
      votes: value.votes,
    }))
    .sort((a, b) => b.pct - a.pct);

  const picks: PickRow[] = (recentVotes ?? [])
    .map((v) => {
      const options = v.comparisons?.comparison_options ?? [];
      const chosen = options.find((o) => o.id === v.option_id);
      const other = options.find((o) => o.id !== v.option_id);
      if (!chosen || !other) return null;
      return { comparisonId: v.comparison_id, chosenLabel: chosen.label, otherLabel: other.label };
    })
    .filter((p) => p !== null);

  const initialAnswers = Object.fromEntries((answerRows ?? []).map((a) => [a.question_key, a.answer]));

  const initialOutfit = Object.fromEntries(
    (outfitRows ?? []).map((r) => [r.slot as WardrobeSlot, r.item_id])
  ) as Partial<Record<WardrobeSlot, string | null>>;

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <div className="flex items-center gap-4">
        <Avatar name={profile?.username ?? "?"} src={profile?.avatar_url} size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold text-text-primary">
            {profile?.display_name || profile?.username}
          </p>
          <p className="text-sm text-text-secondary">
            @{profile?.username} · {totalVotes ?? 0} votes · {profile?.follower_count ?? 0} followers
          </p>
          <p className="text-sm text-text-secondary">⭐ {profile?.reputation ?? 0} reputation</p>
          {(profile?.current_streak ?? 0) > 0 && (
            <p className="mt-0.5 text-sm font-semibold text-accent">
              🔥 {profile?.current_streak} day streak
              {profile && profile.longest_streak > profile.current_streak
                ? ` · best ${profile.longest_streak}`
                : ""}
            </p>
          )}
        </div>
        <Link href="/saved" aria-label="Saved" className="tap-scale shrink-0 text-text-secondary">
          <BookmarkIcon />
        </Link>
        <Link href="/settings" aria-label="Settings" className="tap-scale shrink-0 text-text-secondary">
          <GearIcon />
        </Link>
      </div>

      <Link href="/card">
        <Button className="w-full">View my Card</Button>
      </Link>

      <AvatarPicker />

      <WardrobeShelf
        items={(wardrobeItems ?? []) as WardrobeItemRow[]}
        initialOwnedItemIds={(ownedWardrobe ?? []).map((r) => r.item_id)}
        initialOutfit={initialOutfit}
        viewerId={user.id}
        viewerEmail={user.email ?? ""}
        viewerUsername={profile?.username ?? user.id}
      />

      <PersonalDetailsFlow initialAnswers={initialAnswers} initialAiBio={profile?.ai_bio ?? null} />

      <div>
        <p className="mb-3 text-lg font-semibold text-text-primary">Preference DNA</p>
        <DnaBreakdown rows={rows} />
      </div>

      <TopPreferences signals={preferenceSignals} />

      <AchievementBadges types={(achievementRows ?? []).map((a) => a.type)} />

      {picks.length > 0 && (
        <div>
          <p className="mb-3 text-lg font-semibold text-text-primary">Recent picks</p>
          <RecentPicks picks={picks} />
        </div>
      )}

      <TellMeAboutMe initialSummary={card?.ai_summary ?? null} />

      <AskProfileQuestion />

      {profile?.is_admin && (
        <Link href="/admin">
          <Button variant="secondary" className="w-full">
            Moderation
          </Button>
        </Link>
      )}
    </div>
  );
}

function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v16l-6-4-6 4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 13a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.3 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L6.5 11a7.9 7.9 0 0 0-.1 1 7.9 7.9 0 0 0 .1 1l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1L11 21h4l.3-2.6a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
