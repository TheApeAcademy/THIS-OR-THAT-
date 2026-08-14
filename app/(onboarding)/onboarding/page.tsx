import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { shuffle } from "@/lib/shuffle";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: comparisons } = await supabase
    .from("comparisons")
    .select("id, prompt, comparison_options(id, side, label, image_url)")
    .eq("is_onboarding", true);

  return <OnboardingFlow comparisons={shuffle(comparisons ?? [])} />;
}
