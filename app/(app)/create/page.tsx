import { createClient } from "@/lib/supabase/server";
import { CreateForm } from "@/components/CreateForm";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, label, emoji")
    .eq("is_active", true)
    .order("sort_order");

  return <CreateForm categories={categories ?? []} />;
}
