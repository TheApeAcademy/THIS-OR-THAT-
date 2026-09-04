import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditCardForm } from "@/components/EditCardForm";
import { UsernameSettings } from "@/components/UsernameSettings";
import { SettingsToggles } from "@/components/SettingsToggles";
import { PrivacySettings } from "@/components/PrivacySettings";
import { BlockedMutedList, type HiddenUserRow } from "@/components/BlockedMutedList";
import { DataExportButton } from "@/components/DataExportButton";
import { AccountDangerZone } from "@/components/AccountDangerZone";
import { ProUpgradeCard } from "@/components/ProUpgradeCard";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/lib/actions/auth";
import type { SocialLinks } from "@/lib/actions/profile";
import type { Visibility } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

interface HiddenUserJoinRow {
  target: { id: string; username: string; avatar_url: string | null } | null;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: blockedRows }, { data: mutedRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "username, bio, social_links, show_play_score, show_streak, show_dna, card_visibility, preference_visibility, social_links_visibility, compatibility_visibility, country, deactivated_at, is_pro, pro_expires_at"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("blocks")
      .select("target:profiles!blocks_blocked_id_fkey(id, username, avatar_url)")
      .eq("blocker_id", user.id)
      .returns<HiddenUserJoinRow[]>(),
    supabase
      .from("mutes")
      .select("target:profiles!mutes_muted_id_fkey(id, username, avatar_url)")
      .eq("muter_id", user.id)
      .returns<HiddenUserJoinRow[]>(),
  ]);

  const toRow = (r: HiddenUserJoinRow): HiddenUserRow | null =>
    r.target ? { id: r.target.id, username: r.target.username, avatarUrl: r.target.avatar_url } : null;

  const blocked = (blockedRows ?? []).map(toRow).filter((r): r is HiddenUserRow => r !== null);
  const muted = (mutedRows ?? []).map(toRow).filter((r): r is HiddenUserRow => r !== null);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>

      <section className="space-y-4">
        <p className="text-sm font-semibold text-text-secondary">Account</p>
        <UsernameSettings currentUsername={profile?.username ?? ""} />
        <EditCardForm
          initialBio={profile?.bio ?? ""}
          initialSocialLinks={(profile?.social_links as SocialLinks) ?? {}}
        />
      </section>

      <ProUpgradeCard
        viewerId={user.id}
        viewerEmail={user.email ?? ""}
        viewerUsername={profile?.username ?? user.id}
        isPro={!!profile?.is_pro}
        proExpiresAt={profile?.pro_expires_at ?? null}
      />

      <PrivacySettings
        initial={{
          cardVisibility: (profile?.card_visibility as Visibility) ?? "public",
          preferenceVisibility: (profile?.preference_visibility as Visibility) ?? "public",
          socialLinksVisibility: (profile?.social_links_visibility as Visibility) ?? "public",
          compatibilityVisibility: (profile?.compatibility_visibility as Visibility) ?? "public",
        }}
        initialCountry={profile?.country ?? null}
      />

      <SettingsToggles
        initialShowPlayScore={profile?.show_play_score ?? true}
        initialShowStreak={profile?.show_streak ?? true}
        initialShowDna={profile?.show_dna ?? true}
      />

      <BlockedMutedList initialBlocked={blocked} initialMuted={muted} />

      <section className="rounded-xl border border-border bg-surface-raised p-4">
        <p className="mb-1 text-sm font-semibold text-text-secondary">Notifications</p>
        <p className="text-xs text-text-secondary">
          You get notified when someone follows you, comments on your debates, replies to your comments,
          or likes one of your comments. Manage them from the Activity tab.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
        <p className="text-sm font-semibold text-text-secondary">Your data</p>
        <DataExportButton />
      </section>

      <AccountDangerZone initialDeactivated={!!profile?.deactivated_at} />

      <section className="rounded-xl border border-border bg-surface-raised p-4 text-xs text-text-secondary">
        <p className="mb-1 text-sm font-semibold text-text-secondary">About</p>
        This or That — every choice tells a story.
      </section>

      <form action={signOutAction}>
        <Button type="submit" variant="secondary" className="w-full">
          Log out
        </Button>
      </form>
    </div>
  );
}
