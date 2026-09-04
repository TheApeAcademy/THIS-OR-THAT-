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

function generateCode() {
  // 10 chars from an unambiguous alphabet (no 0/O/1/I/L) — easy to read
  // and re-type by hand.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

// Generates 10 fresh backup codes for the caller's own account, replacing
// any previously issued (unused or used) codes. Identifies the caller by
// their own JWT — never trusts a user id from the request body — same
// pattern as delete-account.
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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const codes = Array.from({ length: 10 }, generateCode);
    const rows = await Promise.all(
      codes.map(async (code) => ({ user_id: user.id, code_hash: await sha256Hex(code) }))
    );

    await adminClient.from("mfa_backup_codes").delete().eq("user_id", user.id);
    const { error: insertError } = await adminClient.from("mfa_backup_codes").insert(rows);
    if (insertError) return json({ error: insertError.message }, 500);

    return json({ codes });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
