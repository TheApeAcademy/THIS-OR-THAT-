export const CARD_THEMES = {
  blue: {
    label: "Blue",
    gradient: "linear-gradient(155deg, #050914 0%, #0a1a3d 45%, #0066ff 100%)",
    glow: "0 24px 60px -20px rgba(0, 102, 255, 0.55)",
    accent: "#38bdf8",
  },
  purple: {
    label: "Purple",
    gradient: "linear-gradient(155deg, #0f0714 0%, #2a0a3d 45%, #8b00ff 100%)",
    glow: "0 24px 60px -20px rgba(139, 0, 255, 0.55)",
    accent: "#c084fc",
  },
  green: {
    label: "Green",
    gradient: "linear-gradient(155deg, #04140c 0%, #0a3d1f 45%, #00c874 100%)",
    glow: "0 24px 60px -20px rgba(0, 200, 116, 0.45)",
    accent: "#4ade80",
  },
  sunset: {
    label: "Sunset",
    gradient: "linear-gradient(155deg, #1a0a05 0%, #4d1a0a 45%, #ff6600 100%)",
    glow: "0 24px 60px -20px rgba(255, 102, 0, 0.5)",
    accent: "#fb923c",
  },
  mono: {
    label: "Mono",
    gradient: "linear-gradient(155deg, #0a0a0a 0%, #1a1a1a 45%, #3a3a3a 100%)",
    glow: "0 24px 60px -20px rgba(0, 0, 0, 0.5)",
    accent: "#9ca3af",
  },
} as const;

export type CardThemeKey = keyof typeof CARD_THEMES;

export function isCardThemeKey(value: string): value is CardThemeKey {
  return value in CARD_THEMES;
}

export function cardTheme(key: string | null | undefined) {
  return CARD_THEMES[isCardThemeKey(key ?? "") ? (key as CardThemeKey) : "blue"];
}
