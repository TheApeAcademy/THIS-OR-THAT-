import { createClient } from "npm:@supabase/supabase-js@2";
import { generateAuthenticationOptions } from "npm:@simplewebauthn/server@14.0.0";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "localhost";

// No signed-in caller yet — this is how passkey sign-in starts. Uses
// discoverable (resident-key) credentials, so the browser/authenticator
// picks the matching passkey without the server needing to know who's
// signing in beforehand (allowCredentials stays empty).
Deno.serve(async () => {
  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "preferred",
      allowCredentials: [],
    });

    const { data: row, error } = await adminClient
      .from("webauthn_challenges")
      .insert({ user_id: null, challenge: options.challenge })
      .select("id")
      .single();
    if (error) return json({ error: error.message }, 500);

    return json({ options, challengeRowId: row.id });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
