import type { Options as AvataaarsOptions } from "@dicebear/avataaars";

type Top = NonNullable<AvataaarsOptions["top"]>[number];
type Eyebrows = NonNullable<AvataaarsOptions["eyebrows"]>[number];
type Eyes = NonNullable<AvataaarsOptions["eyes"]>[number];
type Mouth = NonNullable<AvataaarsOptions["mouth"]>[number];
type FacialHair = NonNullable<AvataaarsOptions["facialHair"]>[number];
type Accessories = NonNullable<AvataaarsOptions["accessories"]>[number];
type Clothing = NonNullable<AvataaarsOptions["clothing"]>[number];
type ClothingGraphic = NonNullable<AvataaarsOptions["clothingGraphic"]>[number];

// Every real option this style supports (not a curated subset) — the full
// schema from @dicebear/avataaars.
export const SKIN_COLORS = ["614335", "d08b5b", "ae5d29", "edb98a", "ffdbb4", "fd9841", "f8d25c"];

export const TOPS: Top[] = [
  "bob",
  "bun",
  "curly",
  "curvy",
  "dreads",
  "frida",
  "fro",
  "froBand",
  "longButNotTooLong",
  "miaWallace",
  "shavedSides",
  "straight02",
  "straight01",
  "straightAndStrand",
  "dreads01",
  "dreads02",
  "frizzle",
  "shaggy",
  "shaggyMullet",
  "shortCurly",
  "shortFlat",
  "shortRound",
  "shortWaved",
  "sides",
  "theCaesar",
  "theCaesarAndSidePart",
  "bigHair",
  "hat",
  "hijab",
  "turban",
  "winterHat1",
  "winterHat02",
  "winterHat03",
  "winterHat04",
];

export const HAIR_COLORS = [
  "a55728",
  "2c1b18",
  "b58143",
  "d6b370",
  "724133",
  "4a312c",
  "f59797",
  "ecdcbf",
  "c93305",
  "e8e1e1",
];

export const EYEBROWS: Eyebrows[] = [
  "defaultNatural",
  "angryNatural",
  "flatNatural",
  "frownNatural",
  "raisedExcitedNatural",
  "sadConcernedNatural",
  "unibrowNatural",
  "upDownNatural",
  "default",
  "angry",
  "raisedExcited",
  "sadConcerned",
  "upDown",
];

export const EYES: Eyes[] = [
  "default",
  "closed",
  "cry",
  "eyeRoll",
  "happy",
  "hearts",
  "side",
  "squint",
  "surprised",
  "winkWacky",
  "wink",
  "xDizzy",
];

export const MOUTHS: Mouth[] = [
  "default",
  "concerned",
  "disbelief",
  "eating",
  "grimace",
  "sad",
  "screamOpen",
  "serious",
  "smile",
  "tongue",
  "twinkle",
  "vomit",
];

export const FACIAL_HAIR: FacialHair[] = ["beardLight", "beardMedium", "beardMajestic", "moustacheFancy", "moustacheMagnum"];

export const FACIAL_HAIR_COLORS = HAIR_COLORS;

export const ACCESSORIES: Accessories[] = ["round", "prescription01", "prescription02", "sunglasses", "wayfarers", "kurt", "eyepatch"];

export const ACCESSORIES_COLORS = [
  "262e33",
  "65c9ff",
  "5199e4",
  "25557c",
  "e6e6e6",
  "929598",
  "3c4f5c",
  "b1e2ff",
  "a7ffc4",
  "ffdeb5",
  "ffafb9",
  "ffffb1",
  "ff488e",
  "ff5c5c",
  "ffffff",
];

export const CLOTHING: Clothing[] = [
  "shirtCrewNeck",
  "shirtVNeck",
  "shirtScoopNeck",
  "hoodie",
  "collarAndSweater",
  "blazerAndShirt",
  "blazerAndSweater",
  "overall",
  "graphicShirt",
];

export const CLOTHING_GRAPHICS: ClothingGraphic[] = ["skull", "skullOutline", "bear", "deer", "diamond", "bat", "cumbia", "hola", "pizza", "resist"];

export const CLOTHES_COLORS = [
  "262e33",
  "65c9ff",
  "5199e4",
  "25557c",
  "e6e6e6",
  "929598",
  "3c4f5c",
  "b1e2ff",
  "a7ffc4",
  "ffafb9",
  "ffffb1",
  "ff488e",
  "ff5c5c",
  "ffffff",
];

export const BACKGROUND_COLORS = ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "c9f2c7"];

export const HAT_COLORS = ACCESSORIES_COLORS;

// "top" doubles as hair AND headwear — these entries wear a hat color
// instead of a hair color.
export const HEADWEAR_TOPS: Top[] = ["hat", "hijab", "turban", "winterHat1", "winterHat02", "winterHat03", "winterHat04"];

export interface AvataaarsChoice {
  skinColor: string;
  top: Top | null;
  hairColor: string;
  hatColor: string;
  eyebrows: Eyebrows;
  eyes: Eyes;
  mouth: Mouth;
  facialHair: FacialHair | null;
  facialHairColor: string;
  accessories: Accessories | null;
  accessoriesColor: string;
  clothing: Clothing;
  clothingGraphic: ClothingGraphic | null;
  clothesColor: string;
  backgroundColor: string;
  seed: string;
}

export const DEFAULT_AVATAAARS_CHOICE: AvataaarsChoice = {
  skinColor: SKIN_COLORS[0],
  top: TOPS[0],
  hairColor: HAIR_COLORS[0],
  hatColor: HAT_COLORS[0],
  eyebrows: EYEBROWS[0],
  eyes: EYES[0],
  mouth: MOUTHS[0],
  facialHair: null,
  facialHairColor: FACIAL_HAIR_COLORS[0],
  accessories: null,
  accessoriesColor: ACCESSORIES_COLORS[0],
  clothing: CLOTHING[0],
  clothingGraphic: null,
  clothesColor: CLOTHES_COLORS[0],
  backgroundColor: BACKGROUND_COLORS[0],
  seed: "default",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomAvataaarsChoice(): AvataaarsChoice {
  const clothing = pick(CLOTHING);
  return {
    skinColor: pick(SKIN_COLORS),
    top: Math.random() < 0.92 ? pick(TOPS) : null,
    hairColor: pick(HAIR_COLORS),
    hatColor: pick(HAT_COLORS),
    eyebrows: pick(EYEBROWS),
    eyes: pick(EYES),
    mouth: pick(MOUTHS),
    facialHair: Math.random() < 0.2 ? pick(FACIAL_HAIR) : null,
    facialHairColor: pick(FACIAL_HAIR_COLORS),
    accessories: Math.random() < 0.3 ? pick(ACCESSORIES) : null,
    accessoriesColor: pick(ACCESSORIES_COLORS),
    clothing,
    clothingGraphic: clothing === "graphicShirt" ? pick(CLOTHING_GRAPHICS) : null,
    clothesColor: pick(CLOTHES_COLORS),
    backgroundColor: pick(BACKGROUND_COLORS),
    seed: Math.random().toString(36).slice(2),
  };
}
