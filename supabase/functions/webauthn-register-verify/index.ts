import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyRegistrationResponse } from "npm:@simplewebauthn/server@14.0.0";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "localhost";
const ORIGIN = Deno.env.get("WEBAUTHN_ORIGIN") ?? "http://localhost:3000";

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

    const { response, deviceLabel } = await req.json();
    if (!response) return json({ error: "Missing registration response" }, 400);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: challengeRow } = await adminClient
      .from("webauthn_challenges")
      .select("id, challenge")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challengeRow) return json({ error: "Registration expired — try again" }, 400);

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return json({ error: "Could not verify passkey" }, 400);
    }

    const { credential } = verification.registrationInfo;

    const { error: insertError } = await adminClient.from("passkey_credentials").insert({
      user_id: user.id,
      credential_id: credential.id,
      public_key: btoa(String.fromCharCode(...credential.publicKey)),
      counter: credential.counter,
      device_label: typeof deviceLabel === "string" ? deviceLabel.slice(0, 60) : null,
    });
    if (insertError) return json({ error: insertError.message }, 500);

    await adminClient.from("webauthn_challenges").delete().eq("id", challengeRow.id);

    return json({ success: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
