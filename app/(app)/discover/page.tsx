import Link from "next/link";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { Feed } from "@/components/Feed";
import { UserSearch } from "@/components/UserSearch";
import { SparkleIcon, FlameIcon, ScaleIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: me }, { data: categories }, { data: allComparisons }, { data: featuredId }] = await Promise.all([
    user ? supabase.from("profiles").select("username").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("categories").select("id, slug, label, emoji").eq("is_active", true).order("sort_order"),
    supabase.from("comparisons").select("category_id").eq("status", "active"),
    supabase.rpc("get_daily_featured_comparison"),
  ]);

  const counts = new Map<string, number>();
  for (const c of allComparisons ?? []) {
    if (!c.category_id) continue;
    counts.set(c.category_id, (counts.get(c.category_id) ?? 0) + 1);
  }

  let featuredCard: ReturnType<typeof toComparisonCardData> = null;
  if (featuredId) {
    const [{ data: featuredRaw }, { data: myFeaturedVote }] = await Promise.all([
      supabase
        .from("comparisons")
        .select("id, prompt, view_count, expires_at, comparison_options(id, side, label, image_url, vote_count, statement, claimant:profiles!comparison_options_claimed_by_fkey(username, avatar_url, profile_photo_url))")
        .eq("id", featuredId)
        .single<RawComparisonWithOptions>(),
      user
        ? supabase.from("votes").select("option_id").eq("comparison_id", featuredId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    featuredCard = featuredRaw ? toComparisonCardData(featuredRaw, myFeaturedVote?.option_id) : null;
  }

  const activeCategory = (categories ?? []).find((c) => c.slug === category);

  let trendingQuery = supabase
    .from("comparisons")
    .select("id, prompt, view_count, expires_at, comparison_options(id, side, label, image_url, vote_count, statement, claimant:profiles!comparison_options_claimed_by_fkey(username, avatar_url, profile_photo_url))")
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("vote_count", { ascending: false })
    .limit(15);

  if (activeCategory) {
    trendingQuery = trendingQuery.eq("category_id", activeCategory.id);
  }

  const { data: trending } = await trendingQuery.returns<RawComparisonWithOptions[]>();

  const trendingIds = (trending ?? []).map((c) => c.id);
  const { data: myVotes } = user
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", trendingIds)
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  const cards = (trending ?? [])
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c) => c !== null);

  const { data: divisiveRows } = await supabase.rpc("get_most_divisive_comparisons", { p_limit: 15 });
  const divisiveIds = (divisiveRows ?? []).map((r) => r.comparison_id);
  const { data: divisiveRaw } = divisiveIds.length
    ? await supabase
        .from("comparisons")
        .select("id, prompt, view_count, expires_at, comparison_options(id, side, label, image_url, vote_count, statement, claimant:profiles!comparison_options_claimed_by_fkey(username, avatar_url, profile_photo_url))")
        .in("id", divisiveIds)
        .returns<RawComparisonWithOptions[]>()
    : { data: [] as RawComparisonWithOptions[] };
  const divisiveById = new Map((divisiveRaw ?? []).map((c) => [c.id, c]));
  const orderedDivisive = divisiveIds.map((id) => divisiveById.get(id)).filter((c): c is RawComparisonWithOptions => !!c);
  const divisiveVotedByComparison = user
    ? new Map(
        ((await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", divisiveIds)).data ?? []).map(
          (v) => [v.comparison_id, v.option_id]
        )
      )
    : new Map<string, string>();
  const divisiveCards = orderedDivisive
    .map((c) => toComparisonCardData(c, divisiveVotedByComparison.get(c.id)))
    .filter((c) => c !== null);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Discover</h1>
        <div className="flex gap-2">
          <Link
            href="/duels"
            className="tap-scale rounded-full bg-accent-soft px-3 py-1.5 text-sm font-bold text-accent"
          >
            ⚔️ Duels
          </Link>
          <Link
            href="/groups"
            className="tap-scale rounded-full bg-accent-soft px-3 py-1.5 text-sm font-bold text-accent"
          >
            👥 Groups
          </Link>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-text-secondary">Find people</p>
        <UserSearch myUsername={me?.username ?? null} />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-text-secondary">Categories</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/discover"
            className={clsx(
              "tap-scale rounded-full border px-3 py-1.5 text-sm font-medium",
              !activeCategory
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border text-text-secondary"
            )}
          >
            All
          </Link>
          {(categories ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/discover?category=${c.slug}`}
              className={clsx(
                "tap-scale rounded-full border px-3 py-1.5 text-sm font-medium",
                activeCategory?.id === c.id
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-border text-text-secondary"
              )}
            >
              {c.emoji} {c.label} <span className="opacity-70">· {counts.get(c.id) ?? 0}</span>
            </Link>
          ))}
        </div>
      </div>

      {featuredCard && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
            <SparkleIcon size={14} className="text-accent" /> Featured
          </p>
          <div className="-mx-4">
            <Feed initialComparisons={[featuredCard]} />
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
          <FlameIcon size={14} className="text-accent" /> Trending{activeCategory ? ` in ${activeCategory.label}` : ""}
        </p>
        {cards.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">Nothing trending here yet.</p>
        ) : (
          <div className="-mx-4">
            <Feed initialComparisons={cards} />
          </div>
        )}
      </div>

      {divisiveCards.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
            <ScaleIcon size={14} className="text-accent" /> Most Divisive
          </p>
          <div className="-mx-4">
            <Feed initialComparisons={divisiveCards} />
          </div>
        </div>
      )}
    </div>
  );
}
