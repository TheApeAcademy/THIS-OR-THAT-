"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DataConsentTier =
  | "none"
  | "anonymous"
  | "aggregated"
  | "personalized"
  | "advertising"
  | "research"
  | "licensing";

export async function updateDataConsentAction(tier: DataConsentTier) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("profiles").update({ data_consent: tier }).eq("id", user.id);
  if (error) throw error;

  revalidatePath("/profile");
}
