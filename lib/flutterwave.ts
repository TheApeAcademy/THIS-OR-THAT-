// Client-safe Flutterwave constants and tx_ref builders. Actual charge
// verification (never trust the client) happens server-side in the
// flutterwave-webhook edge function, which re-derives the same price
// constants — keep the two in sync if these ever change.

export const PRO_PRICE = 4.99;
export const FLUTTERWAVE_CURRENCY = "USD";

/** tx_ref format the webhook parses to know what to grant: `tot-pro_<userId>_<timestamp>`. */
export function buildProTxRef(userId: string): string {
  return `tot-pro_${userId}_${Date.now()}`;
}

/** tx_ref format the webhook parses to know what to grant: `tot-wardrobe_<userId>_<itemId>_<timestamp>`. */
export function buildWardrobeTxRef(userId: string, itemId: string): string {
  return `tot-wardrobe_${userId}_${itemId}_${Date.now()}`;
}
