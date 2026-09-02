// Deterministic, free, instant per-category "voice" line for a Preference
// DNA row - mirrors lib/archetype.ts exactly: no AI call, fixed copy pools
// banded by percentage and selected via a hash of username+category so the
// same person always sees the same line for a given band, not a random one
// on every render.
const BANDS = {
  music: {
    high: ["You don't just listen, you curate.", "Music runs the show for you.", "Basically a walking playlist."],
    mid: ["A solid appreciation, not an obsession.", "You've got range here.", "Casually plugged in."],
    low: ["Not really your thing, and that's fine.", "Music takes a back seat for you.", "You dabble, that's about it."],
  },
  cars: {
    high: ["You know a good engine when you hear one.", "Horsepower talk gets your attention.", "Certified car guy energy."],
    mid: ["You'll admire a nice ride without obsessing.", "You know the basics and like it that way.", "A casual gearhead."],
    low: ["Cars are just how you get places.", "You couldn't care less about the badge.", "Not a car person, no shame in it."],
  },
  fashion: {
    high: ["Every fit is intentional.", "You notice what everyone else misses.", "Style is basically a language for you."],
    mid: ["You've got a look, and you know it.", "Fashion-aware, not fashion-obsessed.", "You show up put together."],
    low: ["Function over fashion, always.", "You'll wear whatever's clean.", "Style just isn't the priority."],
  },
  travel: {
    high: ["Your passport is doing overtime.", "Always planning the next trip.", "Home is wherever the flight lands."],
    mid: ["You'll take a trip when it counts.", "A trip a year keeps you happy.", "Travel curious, not travel obsessed."],
    low: ["You're happiest close to home.", "Travel's a nice idea, someday.", "Not really chasing stamps."],
  },
  gaming: {
    high: ["You were born with a controller in hand.", "Respawn is basically your middle name.", "Gaming isn't a hobby, it's a lifestyle."],
    mid: ["You'll get a few rounds in when you can.", "A casual but real gamer.", "You know your way around a controller."],
    low: ["Gaming's not really your scene.", "You'll watch before you'll play.", "Not much of a gamer, and that's okay."],
  },
  sports: {
    high: ["You know the stat sheet better than the players.", "Game day is basically a holiday for you.", "Full-blown sports obsessive."],
    mid: ["You'll catch the big games.", "A fan, not a fanatic.", "You follow along when it matters."],
    low: ["Sports mostly pass you by.", "You'll tune in for the finale, maybe.", "Not really a sports person."],
  },
  food: {
    high: ["You plan your day around the next meal.", "A certified flavor chaser.", "Food is basically your love language."],
    mid: ["You appreciate a good meal without obsessing.", "You'll try something new when it's around.", "A casual foodie."],
    low: ["Food's just fuel for you.", "You're not chasing flavor, just full.", "Not really a foodie, and that's fine."],
  },
  movies: {
    high: ["You've probably already seen it twice.", "You stay for the credits, every time.", "Basically a walking film encyclopedia."],
    mid: ["You'll catch the big ones.", "A casual movie fan.", "You know your favorites and stick to them."],
    low: ["Movies aren't really your thing.", "You'll watch if someone else picks.", "Not much of a movie person."],
  },
  technology: {
    high: ["You read the spec sheet before the review.", "Early adopter, every single time.", "Basically your own tech support."],
    mid: ["You keep up without obsessing.", "A casual gadget person.", "You know enough to get by, and then some."],
    low: ["Tech is just a tool for you.", "You'll use it, not geek out over it.", "Not really a gadget person."],
  },
  trivia: {
    high: ["You're the one everyone wants on their team.", "A walking fun-fact machine.", "Trivia night was made for you."],
    mid: ["You'll surprise people with a random fact.", "A casual trivia fan.", "You know more than you let on."],
    low: ["Trivia's not really your game.", "You'll guess and hope for the best.", "Not much of a trivia person."],
  },
} as const;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Returns a stable one-line "voice" comment for a DNA row, or null if the
 * category isn't recognized. Band thresholds: >=35% high, 15-35% mid, <15% low.
 */
export function getDnaCommentary(categorySlug: string, pct: number, seed: string): string | null {
  const pool = BANDS[categorySlug as keyof typeof BANDS];
  if (!pool) return null;
  const band = pct >= 35 ? pool.high : pct >= 15 ? pool.mid : pool.low;
  return band[hashString(`${seed}:${categorySlug}`) % band.length];
}
