import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DnaBreakdown, type DnaRow } from "@/components/DnaBreakdown";
import { RecentPicks, type PickRow } from "@/components/RecentPicks";
import { TellMeAboutMe } from "@/components/TellMeAboutMe";
import { EditCardForm } from "@/components/EditCardForm";
import { PersonalDetailsFlow } from "@/components/PersonalDetailsFlow";
import { SettingsToggles } from "@/components/SettingsToggles";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/lib/actions/auth";
import type { SocialLinks } from "@/lib/actions/profile";

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
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "username, display_name, avatar_url, is_admin, bio, social_links, ai_bio, current_streak, longest_streak, show_play_score"
      )
      .eq("id", user.id)
      .single(),
    supabase.from("preference_dna").select("breakdown").eq("user_id", user.id).maybeSingle(),
    supabase.from("votes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("categories").select("slug, label, emoji"),
    supabase
      .from("votes")
      .select("comparison_id, option_id, comparisons(comparison_options(id, label))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<VoteWithComparison[]>(),
    supabase.from("cards").select("ai_summary").eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_answers").select("question_key, answer").eq("user_id", user.id),
  ]);

  const categoryMeta = new Map((categories ?? []).map((c) => [c.slug, c]));
  const breakdown = (dna?.breakdown ?? {}) as Record<string, { votes: number; pct: number }>;

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

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <div className="flex items-center gap-4">
        <Avatar name={profile?.username ?? "?"} src={profile?.avatar_url} size={64} />
        <div>
          <p className="text-xl font-bold text-text-primary">
            {profile?.display_name || profile?.username}
          </p>
          <p className="text-sm text-text-secondary">
            @{profile?.username} · {totalVotes ?? 0} votes
          </p>
          {(profile?.current_streak ?? 0) > 0 && (
            <p className="mt-0.5 text-sm font-semibold text-accent">
              🔥 {profile?.current_streak} day streak
              {profile && profile.longest_streak > profile.current_streak
                ? ` · best ${profile.longest_streak}`
                : ""}
            </p>
          )}
        </div>
      </div>

      <Link href="/card">
        <Button className="w-full">View my Card</Button>
      </Link>

      <EditCardForm
        initialBio={profile?.bio ?? ""}
        initialSocialLinks={(profile?.social_links as SocialLinks) ?? {}}
      />

      <PersonalDetailsFlow initialAnswers={initialAnswers} initialAiBio={profile?.ai_bio ?? null} />

      <SettingsToggles initialShowPlayScore={profile?.show_play_score ?? true} />

      <div>
        <p className="mb-3 text-lg font-semibold text-text-primary">Preference DNA</p>
        <DnaBreakdown rows={rows} />
      </div>

      {picks.length > 0 && (
        <div>
          <p className="mb-3 text-lg font-semibold text-text-primary">Recent picks</p>
          <RecentPicks picks={picks} />
        </div>
      )}

      <TellMeAboutMe initialSummary={card?.ai_summary ?? null} />

      {profile?.is_admin && (
        <Link href="/admin">
          <Button variant="secondary" className="w-full">
            Moderation
          </Button>
        </Link>
      )}

      <form action={signOutAction}>
        <Button type="submit" variant="secondary" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
