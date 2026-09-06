// Centralized TOT Pro entitlement check. `profiles.is_pro` is never flipped
// back to false when a subscription lapses (the Flutterwave webhook only
// ever sets it true + extends pro_expires_at), so `is_pro` alone is not
// trustworthy after expiry - pro_expires_at is the actual source of truth.
export interface ProfileEntitlementFields {
  is_pro: boolean | null;
  pro_expires_at: string | null;
}

export function isProActive(profile: ProfileEntitlementFields | null | undefined): boolean {
  if (!profile?.is_pro || !profile.pro_expires_at) return false;
  return new Date(profile.pro_expires_at) > new Date();
}

export type ProFeature = "premium_card_themes" | "avatar_3d";

const PRO_FEATURES = new Set<ProFeature>(["premium_card_themes", "avatar_3d"]);

export function canUse(feature: ProFeature, profile: ProfileEntitlementFields | null | undefined): boolean {
  return PRO_FEATURES.has(feature) ? isProActive(profile) : true;
}
