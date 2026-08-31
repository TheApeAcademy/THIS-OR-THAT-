export type UsernameTier = "free" | "premium" | "rare";

// Short handles are scarce and worth more — same idea as early Twitter/IG
// usernames. Tiering is purely by length for now; the actual charge isn't
// wired up yet (see lib/actions/username.ts).
export function usernameTier(username: string): { tier: UsernameTier; price: number | null } {
  if (username.length <= 3) return { tier: "rare", price: 25 };
  if (username.length === 4) return { tier: "premium", price: 10 };
  return { tier: "free", price: null };
}
