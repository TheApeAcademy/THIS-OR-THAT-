"use server";

import { redirect } from "next/navigation";
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

// A soft delete request, not an irreversible client-triggered delete —
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
