export type CardTheme = "blue" | "purple" | "green" | "sunset" | "mono" | "neon" | "glass" | "luxury";

export interface CardThemePalette {
  label: string;
  gradient: string;
  glow: string;
  accent: string;
  swatch: string;
  pro?: boolean;
}

export const CARD_THEMES: Record<CardTheme, CardThemePalette> = {
  blue: {
    label: "Blue",
    gradient: "linear-gradient(155deg, #050914 0%, #0a1a3d 45%, #0066ff 100%)",
    glow: "radial-gradient(circle, #38bdf8, transparent 70%)",
    accent: "#7dd3fc",
    swatch: "#0066ff",
  },
  purple: {
    label: "Purple",
    gradient: "linear-gradient(155deg, #0c0714 0%, #24123f 45%, #7c3aed 100%)",
    glow: "radial-gradient(circle, #c084fc, transparent 70%)",
    accent: "#d8b4fe",
    swatch: "#7c3aed",
  },
  green: {
    label: "Green",
    gradient: "linear-gradient(155deg, #06120c 0%, #0d2e1e 45%, #059669 100%)",
    glow: "radial-gradient(circle, #34d399, transparent 70%)",
    accent: "#6ee7b7",
    swatch: "#059669",
  },
  sunset: {
    label: "Sunset",
    gradient: "linear-gradient(155deg, #170a09 0%, #4a1620 45%, #f97316 100%)",
    glow: "radial-gradient(circle, #fb923c, transparent 70%)",
    accent: "#fdba74",
    swatch: "#f97316",
  },
  mono: {
    label: "Mono",
    gradient: "linear-gradient(155deg, #050505 0%, #1a1a1a 45%, #404040 100%)",
    glow: "radial-gradient(circle, #a3a3a3, transparent 70%)",
    accent: "#d4d4d4",
    swatch: "#525252",
  },
  neon: {
    label: "Neon",
    gradient: "linear-gradient(155deg, #05010a 0%, #1a0a2e 45%, #ff00e5 100%)",
    glow: "radial-gradient(circle, #ff5ef0, transparent 70%)",
    accent: "#5ef7ff",
    swatch: "#ff00e5",
    pro: true,
  },
  glass: {
    label: "Glass",
    gradient: "linear-gradient(155deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 100%)",
    glow: "radial-gradient(circle, #ffffff, transparent 70%)",
    accent: "#e5e7eb",
    swatch: "#94a3b8",
    pro: true,
  },
  luxury: {
    label: "Luxury",
    gradient: "linear-gradient(155deg, #0a0704 0%, #2b2008 45%, #d4af37 100%)",
    glow: "radial-gradient(circle, #f5d576, transparent 70%)",
    accent: "#f5d576",
    swatch: "#d4af37",
    pro: true,
  },
};

export function cardThemePalette(theme: string | null | undefined): CardThemePalette {
  return CARD_THEMES[(theme as CardTheme) ?? "blue"] ?? CARD_THEMES.blue;
}
