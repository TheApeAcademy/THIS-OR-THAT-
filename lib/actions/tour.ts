"use server";

import { createClient } from "@/lib/supabase/server";

export async function completeTourAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ tour_completed_at: new Date().toISOString() }).eq("id", user.id);
}
