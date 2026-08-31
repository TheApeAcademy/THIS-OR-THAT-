import type { Options as AdventurerOptions } from "@dicebear/adventurer";

type HairStyle = NonNullable<AdventurerOptions["hair"]>[number];
type EyeVariant = NonNullable<AdventurerOptions["eyes"]>[number];
type EyebrowVariant = NonNullable<AdventurerOptions["eyebrows"]>[number];
type MouthVariant = NonNullable<AdventurerOptions["mouth"]>[number];
type GlassesVariant = NonNullable<AdventurerOptions["glasses"]>[number];

export const SKIN_COLORS = ["f2d3b1", "ecad80", "9e5622", "763900"];

export const HAIR_COLORS = [
  "0e0e0e",
  "6a4e35",
  "ac6511",
  "cb6820",
  "ab2a18",
  "e5d7a3",
  "b9a05f",
  "796a45",
  "562306",
  "afafaf",
  "3eac2c",
  "85c2c6",
  "dba3be",
  "592454",
];

export const HAIR_STYLES: HairStyle[] = [
  "short01",
  "short05",
  "short09",
  "short13",
  "short16",
  "long01",
  "long05",
  "long10",
  "long15",
  "long20",
  "long26",
];

export const EYES: EyeVariant[] = [
  "variant01",
  "variant04",
  "variant08",
  "variant12",
  "variant16",
  "variant20",
  "variant23",
  "variant26",
];

export const EYEBROWS: EyebrowVariant[] = [
  "variant01",
  "variant03",
  "variant06",
  "variant09",
  "variant12",
  "variant15",
];

export const MOUTHS: MouthVariant[] = [
  "variant01",
  "variant05",
  "variant09",
  "variant13",
  "variant17",
  "variant21",
  "variant25",
  "variant29",
];

export const GLASSES: GlassesVariant[] = ["variant01", "variant02", "variant03", "variant04", "variant05"];

export const BACKGROUND_COLORS = ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "c9f2c7"];

export interface AvatarChoice {
  skinColor: string;
  hair: HairStyle | null;
  hairColor: string;
  eyes: EyeVariant;
  eyebrows: EyebrowVariant;
  mouth: MouthVariant;
  glasses: GlassesVariant | null;
  earrings: boolean;
  backgroundColor: string;
  seed: string;
}

// Fixed (non-random) starting point so server and client render the same
// thing on first paint — randomize only after mount (see AvatarPicker),
// never in an initial render, or hydration mismatches.
export const DEFAULT_AVATAR_CHOICE: AvatarChoice = {
  skinColor: SKIN_COLORS[0],
  hair: HAIR_STYLES[0],
  hairColor: HAIR_COLORS[0],
  eyes: EYES[0],
  eyebrows: EYEBROWS[0],
  mouth: MOUTHS[0],
  glasses: null,
  earrings: false,
  backgroundColor: BACKGROUND_COLORS[0],
  seed: "default",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomAvatarChoice(): AvatarChoice {
  return {
    skinColor: pick(SKIN_COLORS),
    hair: Math.random() < 0.9 ? pick(HAIR_STYLES) : null,
    hairColor: pick(HAIR_COLORS),
    eyes: pick(EYES),
    eyebrows: pick(EYEBROWS),
    mouth: pick(MOUTHS),
    glasses: Math.random() < 0.25 ? pick(GLASSES) : null,
    earrings: Math.random() < 0.2,
    backgroundColor: pick(BACKGROUND_COLORS),
    seed: Math.random().toString(36).slice(2),
  };
}
