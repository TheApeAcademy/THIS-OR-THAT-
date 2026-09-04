import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Redeems a backup code for the caller's own (already aal1, mid-MFA-
// challenge) session. There is no GoTrue API for a custom factor to
// elevate a session straight to aal2, so a valid code instead deletes the
// account's TOTP factor via the Admin API — dropping it back to
// password-only so the person can finish signing in and re-enroll a
// fresh authenticator + codes from Settings. This is disclosed in the
// Settings UI, not silently done.
Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();
    if (userError || !user) return json({ error: "Not authenticated" }, 401);

    const { code } = await req.json().catch(() => ({ code: null }));
    if (!code || typeof code !== "string") return json({ error: "Missing code" }, 400);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const hash = await sha256Hex(code.trim().toUpperCase());
    const { data: match } = await adminClient
      .from("mfa_backup_codes")
      .select("id")
      .eq("user_id", user.id)
      .eq("code_hash", hash)
      .is("used_at", null)
      .maybeSingle();

    if (!match) return json({ error: "Invalid or already-used backup code" }, 400);

    await adminClient
      .from("mfa_backup_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", match.id);

    const { data: factorData } = await adminClient.auth.admin.mfa.listFactors({ userId: user.id });
    const verifiedTotp = (factorData?.factors ?? []).filter(
      (f) => f.factor_type === "totp" && f.status === "verified"
    );
    for (const factor of verifiedTotp) {
      await adminClient.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
    }

    return json({ success: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
