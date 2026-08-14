import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureCard } from "@/lib/card";

export const dynamic = "force-dynamic";

export default async function MyCardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slug = await ensureCard(user.id);
  redirect(`/card/${slug}`);
}
