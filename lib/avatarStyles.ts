import { createAvatar } from "@dicebear/core";
import type { Style } from "@dicebear/core";
import * as adventurer from "@dicebear/adventurer";
import * as avataaars from "@dicebear/avataaars";
import * as bottts from "@dicebear/bottts";
import * as pixelArt from "@dicebear/pixel-art";

export type AvatarStyleKey = "adventurer" | "avataaars" | "bottts" | "pixel-art";

export const AVATAR_STYLES: { key: AvatarStyleKey; label: string; description: string }[] = [
  { key: "adventurer", label: "Cartoon", description: "Fully customizable — pick every detail" },
  { key: "avataaars", label: "Classic", description: "The original Bitmoji-style cartoon" },
  { key: "bottts", label: "Bot", description: "A friendly robot" },
  { key: "pixel-art", label: "Retro", description: "8-bit pixel art" },
];

const STYLE_MODULES: Record<AvatarStyleKey, Style<object>> = {
  adventurer: adventurer as Style<object>,
  avataaars: avataaars as Style<object>,
  bottts: bottts as Style<object>,
  "pixel-art": pixelArt as Style<object>,
};

// For the non-"Cartoon" styles we don't hand-curate every attribute (each
// DiceBear style has a completely different options schema) — instead we
// let its own seeded PRNG pick everything, and only expose a background
// color + reroll ("Shuffle"). "Cartoon" (adventurer) keeps the full
// attribute-by-attribute picker in AvatarPicker.tsx.
export function buildStyledAvatarUri(style: AvatarStyleKey, seed: string, backgroundColor: string): string {
  const avatar = createAvatar(STYLE_MODULES[style], {
    seed,
    backgroundColor: [backgroundColor],
    backgroundType: ["solid"],
  });
  return avatar.toDataUri();
}

export function randomSeed(): string {
  return Math.random().toString(36).slice(2);
}
