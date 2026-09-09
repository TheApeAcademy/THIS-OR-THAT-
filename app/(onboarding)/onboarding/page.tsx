import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { next } = await searchParams;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, label, emoji")
    .eq("is_active", true)
    .order("sort_order");

  return <OnboardingFlow categories={categories ?? []} next={next} />;
}
