import { createClient } from "@/lib/supabase/server";
import { CreateForm, type InitialDraft } from "@/components/CreateForm";
import { DraftsList, type DraftSummary } from "@/components/DraftsList";
import type { ComparisonVisibility } from "@/lib/actions/createComparison";
import type { DraftOption } from "@/lib/actions/drafts";

export const dynamic = "force-dynamic";

interface DraftRow {
  id: string;
  category_id: string | null;
  prompt: string | null;
  visibility: string;
  options: DraftOption[];
  updated_at: string;
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const { draft: draftId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: categories }, { data: draftRows }] = await Promise.all([
    supabase.from("categories").select("id, slug, label, emoji").eq("is_active", true).order("sort_order"),
    user
      ? supabase
          .from("comparison_drafts")
          .select("id, category_id, prompt, visibility, options, updated_at")
          .eq("creator_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(10)
          .returns<DraftRow[]>()
      : Promise.resolve({ data: [] as DraftRow[] }),
  ]);

  const drafts: DraftSummary[] = (draftRows ?? []).map((d) => ({
    id: d.id,
    prompt: d.prompt,
    optionLabels: (d.options ?? []).map((o) => o.label),
    updatedAt: d.updated_at,
  }));

  const draftRow = draftId ? (draftRows ?? []).find((d) => d.id === draftId) : undefined;
  const initialDraft: InitialDraft | null = draftRow
    ? {
        id: draftRow.id,
        categoryId: draftRow.category_id,
        prompt: draftRow.prompt,
        visibility: draftRow.visibility as ComparisonVisibility,
        options: draftRow.options ?? [],
      }
    : null;

  return (
    <div className="space-y-6 pb-6">
      <CreateForm categories={categories ?? []} initialDraft={initialDraft} />
      {!draftId && (
        <div className="mx-auto max-w-md px-4">
          <DraftsList drafts={drafts} />
        </div>
      )}
    </div>
  );
}
