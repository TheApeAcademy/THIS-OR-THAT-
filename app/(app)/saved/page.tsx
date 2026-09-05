import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { SavedBoard, type SavedCollection, type SavedItem } from "@/components/SavedBoard";

export const dynamic = "force-dynamic";

interface SavedRow {
  comparison_id: string;
  collection_id: string | null;
  comparisons: (RawComparisonWithOptions & { status: string }) | null;
}

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: collectionRows }, { data: savedRows }] = await Promise.all([
    supabase
      .from("bookmark_collections")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("saved_comparisons")
      .select(
        "comparison_id, collection_id, comparisons(id, prompt, status, comparison_options!comparison_options_comparison_id_fkey(id, side, label, image_url, vote_count))"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<SavedRow[]>(),
  ]);

  const collections: SavedCollection[] = (collectionRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  const validRows = (savedRows ?? []).filter((r) => r.comparisons && r.comparisons.status === "active");
  const ids = validRows.map((r) => r.comparison_id);
  const { data: myVotes } = ids.length
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", ids)
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  const items: SavedItem[] = validRows
    .map((r) => {
      const card = toComparisonCardData(r.comparisons!, votedByComparison.get(r.comparison_id));
      return card ? { card, collectionId: r.collection_id } : null;
    })
    .filter((i): i is SavedItem => i !== null);

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      <h1 className="text-2xl font-bold text-text-primary">Saved</h1>
      <SavedBoard initialCollections={collections} initialItems={items} />
    </div>
  );
}
