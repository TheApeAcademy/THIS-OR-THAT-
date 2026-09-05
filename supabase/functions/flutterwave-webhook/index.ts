import { createClient } from "npm:@supabase/supabase-js@2";

// Must match lib/flutterwave.ts's PRO_PRICE — duplicated because edge
// functions are standalone Deno modules and can't import from the Next.js
// app's lib/ directory.
const PRO_PRICE = 4.99;
const PRO_DURATION_DAYS = 30;
const AMOUNT_TOLERANCE = 0.5;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifyTransaction(transactionId: string, secretKey: string) {
  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) throw new Error(`Flutterwave verify request failed: ${res.status}`);
  const json = await res.json();
  return json?.data as
    | { status: string; amount: number; currency: string; tx_ref: string }
    | undefined;
}

// Flutterwave webhook — verify_jwt is set to false for this function in
// supabase/config.toml, since Flutterwave calls this directly (it has no
// Supabase session, only its own verif-hash secret).
Deno.serve(async (req: Request) => {
  try {
    const secretHash = Deno.env.get("FLUTTERWAVE_SECRET_HASH");
    const secretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!secretHash || !secretKey) {
      return json({ error: "Flutterwave secrets are not configured for this project yet." }, 500);
    }

    const signature = req.headers.get("verif-hash");
    if (!signature || signature !== secretHash) {
      return json({ error: "Invalid signature" }, 401);
    }

    const payload = await req.json();
    const transactionId = payload?.data?.id;
    if (!transactionId) return json({ error: "Missing transaction id" }, 400);

    // Never trust the webhook payload's own amount/status — re-verify
    // directly against Flutterwave's API.
    const verified = await verifyTransaction(String(transactionId), secretKey);
    if (!verified || verified.status !== "successful") {
      return json({ received: true, processed: false, reason: "not successful" });
    }

    const txRef = verified.tx_ref;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let kind: "pro" | "wardrobe_item";
    let userId: string;
    let wardrobeItemId: string | null = null;

    if (txRef.startsWith("tot-pro_")) {
      kind = "pro";
      const parts = txRef.slice("tot-pro_".length).split("_");
      userId = parts[0];
    } else if (txRef.startsWith("tot-wardrobe_")) {
      kind = "wardrobe_item";
      const parts = txRef.slice("tot-wardrobe_".length).split("_");
      userId = parts[0];
      wardrobeItemId = parts[1];
    } else {
      return json({ received: true, processed: false, reason: "unrecognized tx_ref" });
    }

    if (!userId) return json({ received: true, processed: false, reason: "no user in tx_ref" });

    let expectedAmount = PRO_PRICE;
    if (kind === "wardrobe_item") {
      if (!wardrobeItemId) return json({ received: true, processed: false, reason: "no item in tx_ref" });
      const { data: item } = await supabase
        .from("wardrobe_items")
        .select("price_cents")
        .eq("id", wardrobeItemId)
        .maybeSingle();
      if (!item?.price_cents) return json({ received: true, processed: false, reason: "item not found or free" });
      expectedAmount = item.price_cents / 100;
    }

    if (Math.abs(verified.amount - expectedAmount) > AMOUNT_TOLERANCE) {
      return json({ received: true, processed: false, reason: "amount mismatch" });
    }

    // Idempotency: the unique constraint on payments.reference rejects a
    // duplicate webhook delivery for the same transaction.
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: userId,
      kind,
      reference: txRef,
      wardrobe_item_id: wardrobeItemId,
      amount_cents: Math.round(verified.amount * 100),
      currency: verified.currency,
    });

    if (paymentError) {
      if (paymentError.code === "23505") {
        return json({ received: true, processed: false, reason: "already processed" });
      }
      throw paymentError;
    }

    if (kind === "pro") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("pro_expires_at")
        .eq("id", userId)
        .maybeSingle();

      const base =
        profile?.pro_expires_at && new Date(profile.pro_expires_at) > new Date()
          ? new Date(profile.pro_expires_at)
          : new Date();
      const nextExpiry = new Date(base.getTime() + PRO_DURATION_DAYS * 24 * 60 * 60 * 1000);

      await supabase
        .from("profiles")
        .update({ is_pro: true, pro_expires_at: nextExpiry.toISOString() })
        .eq("id", userId);
    } else if (wardrobeItemId) {
      const { error: wardrobeError } = await supabase
        .from("user_wardrobe")
        .insert({ user_id: userId, item_id: wardrobeItemId, source: "purchase" });
      if (wardrobeError && wardrobeError.code !== "23505") throw wardrobeError;
    }

    return json({ received: true, processed: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
