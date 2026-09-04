import Link from "next/link";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { Feed } from "@/components/Feed";
import { UserSearch } from "@/components/UserSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";
import { getHiddenAuthorIds } from "@/lib/blocks";

interface TrendingRow extends RawComparisonWithOptions {
  creator_id: string | null;
}

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

  const [{ data: me }, { data: categories }, { data: allComparisons }, unreadCount, hiddenAuthorIds] =
    await Promise.all([
      user ? supabase.from("profiles").select("username").eq("id", user.id).single() : Promise.resolve({ data: null }),
      supabase.from("categories").select("id, slug, label, emoji").eq("is_active", true).order("sort_order"),
      supabase.from("comparisons").select("category_id").eq("status", "active"),
      user ? getUnreadNotificationCount() : Promise.resolve(0),
      user ? getHiddenAuthorIds(supabase, user.id) : Promise.resolve([] as string[]),
    ]);

  const counts = new Map<string, number>();
  for (const c of allComparisons ?? []) {
    if (!c.category_id) continue;
    counts.set(c.category_id, (counts.get(c.category_id) ?? 0) + 1);
  }

  const activeCategory = (categories ?? []).find((c) => c.slug === category);

  let trendingQuery = supabase
    .from("comparisons")
    .select("id, prompt, creator_id, comparison_options(id, side, label, image_url, vote_count)")
    .eq("status", "active")
    .order("vote_count", { ascending: false })
    .limit(hiddenAuthorIds.length > 0 ? 30 : 15);

  if (activeCategory) {
    trendingQuery = trendingQuery.eq("category_id", activeCategory.id);
  }

  const { data: trendingRaw } = await trendingQuery.returns<TrendingRow[]>();
  const hiddenSet = new Set(hiddenAuthorIds);
  const trending = (trendingRaw ?? [])
    .filter((c) => !c.creator_id || !hiddenSet.has(c.creator_id))
    .slice(0, 15);

  const trendingIds = trending.map((c) => c.id);
  const { data: myVotes } = user
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", trendingIds)
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  const cards = trending
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c) => c !== null);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      {user && <NotificationBell unreadCount={unreadCount} />}
      <h1 className="text-2xl font-bold text-text-primary">Discover</h1>

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

      <div>
        <p className="mb-2 text-sm font-semibold text-text-secondary">
          🔥 Trending{activeCategory ? ` in ${activeCategory.label}` : ""}
        </p>
        {cards.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">Nothing trending here yet.</p>
        ) : (
          <div className="-mx-4">
            <Feed initialComparisons={cards} />
          </div>
        )}
      </div>
    </div>
  );
}
