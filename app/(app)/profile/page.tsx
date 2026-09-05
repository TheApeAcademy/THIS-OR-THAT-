import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DnaBreakdown, type DnaRow } from "@/components/DnaBreakdown";
import { RecentPicks, type PickRow } from "@/components/RecentPicks";
import { TellMeAboutMe } from "@/components/TellMeAboutMe";
import { AskProfileQuestion } from "@/components/AskProfileQuestion";
import { EditCardForm } from "@/components/EditCardForm";
import { ProfileHero } from "@/components/ProfileHero";
import { PersonalDetailsFlow } from "@/components/PersonalDetailsFlow";
import { SettingsToggles } from "@/components/SettingsToggles";
import { UsernameSettings } from "@/components/UsernameSettings";
import { PrivacySettings } from "@/components/PrivacySettings";
import { AccountSettings } from "@/components/AccountSettings";
import { ThemeSettings } from "@/components/ThemeSettings";
import { NotificationSettings } from "@/components/NotificationSettings";
import { ProfileActionRow } from "@/components/ProfileActionRow";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";
import { PasskeySettings } from "@/components/PasskeySettings";
import { LoginHistory } from "@/components/LoginHistory";
import { DiscoverabilitySettings } from "@/components/DiscoverabilitySettings";
import { MutedWordsSettings } from "@/components/MutedWordsSettings";
import { Button } from "@/components/ui/Button";
import {
  SparkleIcon,
  UsersIcon,
  EyeIcon,
  IdCardIcon,
  UserIcon,
  ShieldIcon,
  LockIcon,
  SunMoonIcon,
  BellIcon,
} from "@/components/ui/icons";
import { signOutAction } from "@/lib/actions/auth";
import { getArchetype } from "@/lib/archetype";
import { computeVerdict } from "@/lib/verdict";
import { isExpired } from "@/lib/countdown";
import type { SocialLinks } from "@/lib/actions/profile";
import { getLoginHistoryAction, getMutedWordsAction } from "@/lib/actions/security";
import { getPasskeysAction } from "@/lib/actions/passkeys";
import { getCardVersionsAction } from "@/lib/actions/card";
import { DataConsentSettings } from "@/components/DataConsentSettings";
import type { DataConsentTier } from "@/lib/actions/dataConsent";

export const dynamic = "force-dynamic";

interface VoteWithComparison {
  comparison_id: string;
  option_id: string;
  comparisons: { comparison_options: { id: string; label: string }[] } | null;
}

interface VoteForStreak {
  option_id: string;
  comparisons: { expires_at: string | null; comparison_options: { id: string; vote_count: number }[] } | null;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const results = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "username, display_name, avatar_url, avatar_model_url, avatar_upgraded_at, avatar_upgrade_prompt_dismissed_at, profile_photo_url, is_admin, bio, social_links, ai_bio, birthdate, current_streak, longest_streak, streak_freezes, last_active_date, show_play_score, show_streak, show_dna, show_avatar_3d, show_zodiac, show_bio, follower_count, following_count, card_requires_follow, muted_notification_types, discoverable_by_email, discoverable_by_phone, suggest_to_others, hide_sensitive_content, verification_type, deactivated_at, data_consent"
      )
      .eq("id", user.id)
      .single(),
    supabase.from("preference_dna").select("breakdown").eq("user_id", user.id).maybeSingle(),
    supabase.from("votes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("categories").select("slug, label, emoji"),
    supabase
      .from("votes")
      .select("comparison_id, option_id, comparisons(comparison_options!comparison_options_comparison_id_fkey(id, label))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<VoteWithComparison[]>(),
    supabase.from("cards").select("ai_summary, theme").eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_answers").select("question_key, answer").eq("user_id", user.id),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("type", "card_view")
      .is("read_at", null),
    supabase
      .from("votes")
      .select("option_id, comparisons(expires_at, comparison_options!comparison_options_comparison_id_fkey(id, vote_count))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<VoteForStreak[]>(),
    supabase.auth.mfa.listFactors(),
    getPasskeysAction(),
    getLoginHistoryAction(),
    getMutedWordsAction(),
    getCardVersionsAction(),
  ]);

  const QUERY_LABELS = [
    "profile",
    "preference_dna",
    "totalVotes",
    "categories",
    "recentVotes",
    "card",
    "answerRows",
    "unreadConnections",
    "streakVotes",
    "mfaFactors",
  ];
  results.forEach((result, i) => {
    if ("error" in result && result.error) {
      console.error(`[profile page] ${QUERY_LABELS[i]} query failed:`, result.error);
    }
  });

  const [
    { data: profile },
    { data: dna },
    { count: totalVotes },
    { data: categories },
    { data: recentVotes },
    { data: card },
    { data: answerRows },
    { count: unreadConnections },
    { data: streakVotes },
    { data: mfaFactors },
    passkeys,
    loginHistory,
    mutedWords,
    cardVersions,
  ] = results;

  const has2fa = (mfaFactors?.totp ?? []).some((f) => f.status === "verified");

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

  const archetype = getArchetype(rows[0]?.slug, profile?.username ?? "");

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

  // Winning-streak: consecutive *resolved* (expired, time-boxed) debates,
  // most recent first, where this user's pick was among the winners -
  // computed live from vote counts (no schema for it), same computeVerdict
  // logic the feed uses. Comparisons with no deadline never resolve, so
  // they're skipped rather than breaking the streak.
  let debateWinStreak = 0;
  for (const v of streakVotes ?? []) {
    if (!v.comparisons?.expires_at || !isExpired(v.comparisons.expires_at)) continue;
    const verdict = computeVerdict(
      v.comparisons.comparison_options.map((o) => ({ id: o.id, voteCount: o.vote_count }))
    );
    if (!verdict.hasVotes) continue;
    if (verdict.winnerIds.includes(v.option_id)) {
      debateWinStreak += 1;
    } else {
      break;
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <ProfileHero
        username={profile?.username ?? "?"}
        displayName={profile?.display_name ?? null}
        photoUrl={profile?.profile_photo_url ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        avatarModelUrl={profile?.avatar_model_url ?? null}
        hasUpgraded={!!profile?.avatar_upgraded_at}
        upgradeDismissed={!!profile?.avatar_upgrade_prompt_dismissed_at}
        totalVotes={totalVotes ?? 0}
        followerCount={profile?.follower_count ?? 0}
        currentStreak={profile?.current_streak ?? 0}
        longestStreak={profile?.longest_streak ?? 0}
        streakFreezes={profile?.streak_freezes ?? 0}
        birthdate={profile?.birthdate ?? null}
        debateWinStreak={debateWinStreak}
        verificationType={(profile?.verification_type as "none" | "identity" | "social") ?? "none"}
      />

      <div className="space-y-1 rounded-2xl border border-border bg-surface-raised p-2">
        <ProfileActionRow
          icon={<IdCardIcon size={18} />}
          label="Card settings"
          content={
            <EditCardForm
              initialBio={profile?.bio ?? ""}
              initialSocialLinks={(profile?.social_links as SocialLinks) ?? {}}
              initialBirthdate={profile?.birthdate ?? ""}
              initialTheme={card?.theme ?? "blue"}
              versions={cardVersions}
            />
          }
        />
        <ProfileActionRow
          icon={<UserIcon size={18} />}
          label="Personal details"
          content={
            <PersonalDetailsFlow
              initialAnswers={initialAnswers}
              initialAiBio={profile?.ai_bio ?? null}
            />
          }
        />
        <ProfileActionRow
          icon={<span className="text-sm font-bold">@</span>}
          label="Change username"
          content={<UsernameSettings currentUsername={profile?.username ?? ""} />}
        />
        <ProfileActionRow
          icon={<EyeIcon size={18} />}
          label="Card visibility"
          content={
            <SettingsToggles
              initialShowPlayScore={profile?.show_play_score ?? true}
              initialShowStreak={profile?.show_streak ?? true}
              initialShowDna={profile?.show_dna ?? true}
              initialShowAvatar3d={profile?.show_avatar_3d ?? true}
              initialShowZodiac={profile?.show_zodiac ?? true}
              initialShowBio={profile?.show_bio ?? true}
            />
          }
        />
        <ProfileActionRow
          icon={<UsersIcon size={18} />}
          label="Connections"
          href="/profile/connections"
          trailing={
            !!unreadConnections && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-contrast">
                {unreadConnections}
              </span>
            )
          }
        />
        <ProfileActionRow
          icon={<span className="text-sm">⚔️</span>}
          label="Groups"
          href="/groups"
        />
        <ProfileActionRow
          icon={<span className="text-sm">🔖</span>}
          label="Saved"
          href="/saved"
        />
        <ProfileActionRow
          icon={<span className="text-sm">📌</span>}
          label="My Feeds"
          href="/feeds"
        />
        <ProfileActionRow
          icon={<BellIcon size={18} />}
          label="Notifications"
          content={<NotificationSettings initialMutedTypes={profile?.muted_notification_types ?? []} />}
        />
        <ProfileActionRow
          icon={<ShieldIcon size={18} />}
          label="Privacy"
          content={<PrivacySettings initialCardRequiresFollow={profile?.card_requires_follow ?? false} />}
        />
        <ProfileActionRow
          icon={<LockIcon size={18} />}
          label="Account"
          content={
            <AccountSettings
              currentEmail={user.email ?? ""}
              initialDeactivated={!!profile?.deactivated_at}
            />
          }
        />
        <ProfileActionRow
          icon={<span className="text-sm">🔐</span>}
          label="Security"
          content={
            <div className="space-y-3">
              <TwoFactorSettings initialEnabled={has2fa} />
              <PasskeySettings initialPasskeys={passkeys} />
              <LoginHistory initialHistory={loginHistory} />
            </div>
          }
        />
        <ProfileActionRow
          icon={<EyeIcon size={18} />}
          label="Discoverability & muted words"
          content={
            <div className="space-y-3">
              <DiscoverabilitySettings
                initial={{
                  discoverableByEmail: profile?.discoverable_by_email ?? true,
                  discoverableByPhone: profile?.discoverable_by_phone ?? true,
                  suggestToOthers: profile?.suggest_to_others ?? true,
                  hideSensitiveContent: profile?.hide_sensitive_content ?? true,
                }}
              />
              <MutedWordsSettings initialWords={mutedWords} />
            </div>
          }
        />
        <ProfileActionRow
          icon={<span className="text-sm">🗂️</span>}
          label="Data & privacy"
          content={<DataConsentSettings initialTier={(profile?.data_consent as DataConsentTier) ?? "personalized"} />}
        />
        <ProfileActionRow icon={<SunMoonIcon size={18} />} label="App theme" content={<ThemeSettings />} />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <p className="text-lg font-semibold text-text-primary">Preference DNA</p>
          {archetype && (
            <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
              <SparkleIcon size={12} />
              {archetype}
            </span>
          )}
        </div>
        <DnaBreakdown rows={rows} />
      </div>

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

      <form action={signOutAction}>
        <Button type="submit" variant="secondary" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
