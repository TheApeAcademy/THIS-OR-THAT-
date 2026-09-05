"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AccountActionState {
  error?: string;
  success?: string;
}

export async function updateEmailAction(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter an email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };
  return { success: "Check your new email inbox to confirm the change." };
}

export async function updatePasswordAction(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: "Password updated." };
}

// A soft delete request, not an irreversible client-triggered delete -
// actually removing the account/data is a manual/admin follow-up.
export async function requestAccountDeletionAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("profiles").update({ deletion_requested_at: new Date().toISOString() }).eq("id", user.id);
  await supabase.auth.signOut();
  redirect("/login");
}

// Reversible, unlike deletion above - a deactivated account's content is
// hidden from feeds/search/trending (see the restrictive RLS policies in
// 0077_settings_privacy_deactivation.sql) but nothing is deleted, and
// signing back in and toggling this off restores full visibility.
export async function setAccountDeactivatedAction(deactivated: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ deactivated_at: deactivated ? new Date().toISOString() : null })
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/profile");

  if (deactivated) {
    await supabase.auth.signOut();
    redirect("/login");
  }
}
