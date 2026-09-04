"use server";

import { createClient } from "@/lib/supabase/server";
import { recordLoginAction } from "@/lib/actions/security";

/**
 * Redeems the one-time token minted by webauthn-auth-verify. This runs
 * server-side (not the edge function) because it's the request that needs
 * to actually set the session cookies via @supabase/ssr's cookie jar.
 * Deliberately does not call redirect() here — this is invoked directly
 * from a client component inside a try/catch, and redirect() throws a
 * special Next.js signal that a generic catch would swallow. The caller
 * navigates itself once this resolves.
 */
export async function completePasskeySignInAction(tokenHash: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (error || !data.user) throw new Error(error?.message ?? "Couldn't complete passkey sign-in.");

  await recordLoginAction(data.user.id);
}
