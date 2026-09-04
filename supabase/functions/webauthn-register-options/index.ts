import { createClient } from "npm:@supabase/supabase-js@2";
import { generateRegistrationOptions } from "npm:@simplewebauthn/server@14.0.0";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// RP_ID must be the site's bare domain (e.g. "thisorthat.app", "localhost"
// for local dev) — configure it as a Supabase secret. Passkeys are scoped
// to this exact value by the WebAuthn spec, so it can't be inferred from
// the request in a way browsers will trust.
const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "localhost";
const RP_NAME = "This or That";

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

    const { data: profile } = await adminClient
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    const { data: existing } = await adminClient
      .from("passkey_credentials")
      .select("credential_id")
      .eq("user_id", user.id);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(user.id),
      userName: profile?.username ?? user.email ?? user.id,
      attestationType: "none",
      excludeCredentials: (existing ?? []).map((c) => ({ id: c.credential_id })),
      authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
    });

    await adminClient.from("webauthn_challenges").delete().eq("user_id", user.id);
    await adminClient
      .from("webauthn_challenges")
      .insert({ user_id: user.id, challenge: options.challenge });

    return json({ options });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
