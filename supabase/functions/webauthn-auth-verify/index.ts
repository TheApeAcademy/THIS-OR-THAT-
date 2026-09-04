import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAuthenticationResponse } from "npm:@simplewebauthn/server@14.0.0";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "localhost";
const ORIGIN = Deno.env.get("WEBAUTHN_ORIGIN") ?? "http://localhost:3000";

// Verifies a passkey assertion with no session yet, then mints a session
// the browser can redeem itself. There's no GoTrue API to hand back a
// ready-made session from an edge function directly, so this uses the
// same mechanism a magic link uses under the hood: generate a one-time
// token via the Admin API and return its hash, which the browser then
// redeems from a server action (lib/actions/passkeyAuth.ts) via
// supabase.auth.verifyOtp({ token_hash, type: 'magiclink' }) — that call
// runs with access to the response's cookie jar, so it's what actually
// sets the session cookies.
Deno.serve(async (req: Request) => {
  try {
    const { challengeRowId, response } = await req.json();
    if (!challengeRowId || !response) return json({ error: "Missing verification data" }, 400);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: challengeRow } = await adminClient
      .from("webauthn_challenges")
      .select("id, challenge")
      .eq("id", challengeRowId)
      .maybeSingle();
    if (!challengeRow) return json({ error: "Sign-in expired — try again" }, 400);

    const { data: credential } = await adminClient
      .from("passkey_credentials")
      .select("id, user_id, credential_id, public_key, counter")
      .eq("credential_id", response.id)
      .maybeSingle();
    if (!credential) return json({ error: "Passkey not recognized" }, 400);

    const publicKeyBytes = Uint8Array.from(atob(credential.public_key), (c) => c.charCodeAt(0));

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credential.credential_id,
        publicKey: publicKeyBytes,
        counter: credential.counter,
      },
    });

    if (!verification.verified) return json({ error: "Could not verify passkey" }, 400);

    await adminClient
      .from("passkey_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", credential.id);
    await adminClient.from("webauthn_challenges").delete().eq("id", challengeRow.id);

    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(
      credential.user_id
    );
    if (userError || !userData.user?.email) return json({ error: "Account not found" }, 500);

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: userData.user.email,
    });
    if (linkError || !linkData.properties?.hashed_token) {
      return json({ error: linkError?.message ?? "Could not start session" }, 500);
    }

    return json({ tokenHash: linkData.properties.hashed_token });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
