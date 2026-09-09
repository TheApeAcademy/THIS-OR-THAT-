import Link from "next/link";
import { clsx } from "clsx";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { Feed } from "@/components/Feed";
import { PublicTopBar } from "@/components/PublicTopBar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { FlameIcon, ScaleIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore debates · This or That",
  description: "Browse live debates and vote once you sign up - see what people are choosing right now.",
};

const CARD_FIELDS =
  "id, prompt, view_count, expires_at, is_sponsored, sponsor_label, comparison_hashtags(hashtags(tag)), comparison_options!comparison_options_comparison_id_fkey(id, side, label, image_url, vote_count, statement, claimant:profiles!comparison_options_claimed_by_fkey(username, avatar_url, profile_photo_url))";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This route exists specifically for signed-out visitors browsing freely -
  // a logged-in user gets the real, personalized Discover page instead.
  if (user) redirect("/discover");

  const [{ data: categories }] = await Promise.all([
    supabase.from("categories").select("id, slug, label, emoji").eq("is_active", true).order("sort_order"),
  ]);

  const activeCategory = (categories ?? []).find((c) => c.slug === category);

  let trendingQuery = supabase
    .from("comparisons")
    .select(CARD_FIELDS)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("vote_count", { ascending: false })
    .limit(24);
  if (activeCategory) trendingQuery = trendingQuery.eq("category_id", activeCategory.id);
  const { data: trending } = await trendingQuery.returns<RawComparisonWithOptions[]>();
  const cards = (trending ?? []).map((c) => toComparisonCardData(c, null)).filter((c) => c !== null);

  const { data: divisiveRows } = await supabase.rpc("get_most_divisive_comparisons", { p_limit: 12 });
  const divisiveIds = (divisiveRows ?? []).map((r) => r.comparison_id);
  const { data: divisiveRaw } = divisiveIds.length
    ? await supabase.from("comparisons").select(CARD_FIELDS).in("id", divisiveIds).returns<RawComparisonWithOptions[]>()
    : { data: [] as RawComparisonWithOptions[] };
  const divisiveById = new Map((divisiveRaw ?? []).map((c) => [c.id, c]));
  const divisiveCards = divisiveIds
    .map((id) => divisiveById.get(id))
    .filter((c): c is RawComparisonWithOptions => !!c)
    .map((c) => toComparisonCardData(c, null))
    .filter((c) => c !== null);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 pb-16" style={{ paddingTop: "var(--safe-top)" }}>
      <PublicTopBar next="/explore" />

      <div>
        <h1 className="text-2xl font-bold text-text-primary">What are people debating?</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Vote, see live results, and join in - create a free account any time.
        </p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Link
          href="/explore"
          className={clsx(
            "tap-scale shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium",
            !activeCategory ? "border-accent bg-accent text-accent-contrast" : "border-border text-text-secondary"
          )}
        >
          All
        </Link>
        {(categories ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/explore?category=${c.slug}`}
            className={clsx(
              "tap-scale shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium",
              activeCategory?.id === c.id
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border text-text-secondary"
            )}
          >
            {c.emoji} {c.label}
          </Link>
        ))}
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
          <FlameIcon size={14} className="text-accent" /> Trending{activeCategory ? ` in ${activeCategory.label}` : ""}
        </p>
        {cards.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">Nothing trending here yet.</p>
        ) : (
          <div className="-mx-4">
            <Feed initialComparisons={cards} loggedIn={false} />
          </div>
        )}
      </div>

      {divisiveCards.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
            <ScaleIcon size={14} className="text-accent" /> Most divisive
          </p>
          <div className="-mx-4">
            <Feed initialComparisons={divisiveCards} loggedIn={false} />
          </div>
        </div>
      )}

      <div className="glass flex flex-col items-center gap-2 rounded-xl px-6 py-6 text-center">
        <p className="text-sm font-semibold text-text-primary">Ready to vote and see where you stand?</p>
        <Link href="/signup?next=%2Fexplore" className="tap-scale accent-gradient rounded-full px-5 py-2.5 text-sm font-bold text-accent-contrast">
          Create your free account
        </Link>
      </div>

      <InstallPrompt bottomOffset={16} />
    </div>
  );
}
