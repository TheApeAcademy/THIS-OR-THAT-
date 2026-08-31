// A curated, deterministic personality label synthesized from someone's top
// Preference DNA category — turns "Music 32.3%" into something actually
// shareable ("The Playlist Curator") instead of a bare percentage. No AI
// call: fixed copy pools keep it instant, free, and stable per user (the
// same person always gets the same title, chosen by a hash of their
// username rather than randomly, so it doesn't change on every render).
const ARCHETYPES: Record<string, string[]> = {
  music: ["The Playlist Curator", "The Concert Chaser", "The Genre Hopper"],
  cars: ["The Garage Head", "The Horsepower Hunter", "The Grease Monkey"],
  fashion: ["The Fit Check Enthusiast", "The Trend Tracker", "The Closet Curator"],
  travel: ["The Passport Stamper", "The Wanderluster", "The Map Marker"],
  gaming: ["The Controller Native", "The Loot Chaser", "The Respawn Regular"],
  sports: ["The Stat Sheet Nerd", "The Sideline General", "The Trash Talker"],
  food: ["The Snack Strategist", "The Flavor Chaser", "The Menu Maximalist"],
  movies: ["The Credits Watcher", "The Plot Twist Predictor", "The Popcorn Purist"],
  technology: ["The Early Adopter", "The Spec Sheet Reader", "The Gadget Hoarder"],
  trivia: ["The Trivia Sommelier", "The Fun Fact Machine", "The Walking Encyclopedia"],
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Returns a stable personality-label string for someone's top DNA category,
 * or null if there's no top category yet (brand-new users with no votes —
 * deliberately no placeholder title here, matching the rest of the app's
 * "don't show anything until there's real data" convention).
 */
export function getArchetype(topCategorySlug: string | null | undefined, seed: string): string | null {
  if (!topCategorySlug) return null;
  const pool = ARCHETYPES[topCategorySlug];
  if (!pool || pool.length === 0) return null;
  return pool[hashString(seed) % pool.length];
}
