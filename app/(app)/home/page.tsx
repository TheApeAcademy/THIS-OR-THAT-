import { createClient } from "@/lib/supabase/server";
import { getMutedWords } from "@/lib/mutedWords";
import { buildFeedCards } from "@/lib/homeFeedBuilder";
import { HomeFeedTabs } from "@/components/HomeFeedTabs";
import { HomeTourGate } from "@/components/HomeTourGate";
import { StoriesRail, type StoryItem } from "@/components/StoriesRail";
import { StreakRiskBanner } from "@/components/StreakRiskBanner";

export const dynamic = "force-dynamic";

const FEED_SIZE = 30;

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lazy sweep for expired time-boxed polls (see 0066_debate_result_sweep.sql)
  // - no cron/pg_net infra exists, so this piggybacks on Home's own load
  // instead of a true schedule. Fire-and-forget: never blocks render, and a
  // failure here should never break the feed.
  supabase.rpc("sweep_expired_comparisons").then(
    () => {},
    () => {}
  );

  const [{ data: orderRows }, { data: profile }, { data: storyRows }, { data: repostRows }, mutedWords] =
    await Promise.all([
      supabase.rpc("get_feed_order", { p_user_id: user?.id ?? undefined, p_limit: FEED_SIZE }),
      user
        ? supabase
            .from("profiles")
            .select("tour_completed_at, current_streak, last_active_date, streak_freezes, hide_sensitive_content")
            .eq("id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("comparisons")
        .select(
          "id, prompt, expires_at, creator:profiles!comparisons_creator_id_fkey(username, avatar_url, profile_photo_url, is_seed_account), comparison_options!comparison_options_comparison_id_fkey(label)"
        )
        .eq("status", "active")
        .not("expires_at", "is", null)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: true })
        .limit(15)
        .returns<
          {
            id: string;
            prompt: string | null;
            expires_at: string;
            creator: {
              username: string;
              avatar_url: string | null;
              profile_photo_url: string | null;
              is_seed_account: boolean;
            } | null;
            comparison_options: { label: string }[];
          }[]
        >(),
      user
        ? supabase.rpc("get_recent_reposts_from_followed", { p_user_id: user.id, p_limit: 5 })
        : Promise.resolve({ data: [] }),
      user ? getMutedWords(supabase, user.id) : Promise.resolve([] as string[]),
    ]);
  const hideSensitive = profile?.hide_sensitive_content ?? true;
  // Seed/curated content is attributed to "This or That" in the UI, never to
  // the placeholder persona backing it (see FeedSlide's AuthorRow) - Stories
  // needs the same guard so a seed-authored poll can't leak a fake identity.
  const stories: StoryItem[] = (storyRows ?? []).map((s) => ({
    id: s.id,
    heading: s.prompt || s.comparison_options.map((o) => o.label).join(" or "),
    expiresAt: s.expires_at,
    creatorUsername: s.creator && !s.creator.is_seed_account ? s.creator.username : null,
    creatorAvatarUrl:
      s.creator && !s.creator.is_seed_account ? (s.creator.profile_photo_url ?? s.creator.avatar_url) : null,
  }));

  // Reposts from people the viewer follows get pinned to the top of the
  // feed with "reposted by @x" attribution - a light, additive splice
  // rather than touching get_feed_order()'s core ranking SQL.
  const repostedByMap = new Map((repostRows ?? []).map((r) => [r.comparison_id, r.reposter_username]));
  const repostIds = (repostRows ?? []).map((r) => r.comparison_id);
  const rankedIds = (orderRows ?? []).map((r) => r.comparison_id).filter((id) => !repostedByMap.has(id));
  const orderedIds = [...repostIds, ...rankedIds];

  const cards = await buildFeedCards(supabase, user?.id ?? null, orderedIds, mutedWords, hideSensitive, repostedByMap);

  const today = new Date().toISOString().slice(0, 10);
  const streakAtRisk = !!user && (profile?.current_streak ?? 0) > 0 && profile?.last_active_date !== today;

  return (
    <div className="flex h-full flex-col" data-tour="home-feed">
      {streakAtRisk && (
        <StreakRiskBanner
          streak={profile?.current_streak ?? 0}
          hasFreeze={(profile?.streak_freezes ?? 0) > 0}
        />
      )}
      {stories.length > 0 && <StoriesRail stories={stories} />}
      <HomeFeedTabs forYouCards={cards} viewerId={user?.id ?? null} />
      {user && <HomeTourGate show={!profile?.tour_completed_at} />}
    </div>
  );
}
