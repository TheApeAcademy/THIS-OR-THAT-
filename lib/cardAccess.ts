// Single source of truth for "what does viewer X see of owner Y's card" -
// a global default (profiles.show_*) optionally overridden per-viewer by a
// card_access_rules row. Null on a rule field means "inherit the default."
export interface CardVisibility {
  showDna: boolean;
  showPlayScore: boolean;
  showStreak: boolean;
  showAvatar3d: boolean;
  showZodiac: boolean;
  showBio: boolean;
  blocked: boolean;
}

export interface CardAccessRule {
  show_dna: boolean | null;
  show_play_score: boolean | null;
  show_streak: boolean | null;
  show_avatar_3d: boolean | null;
  show_zodiac: boolean | null;
  show_bio: boolean | null;
  blocked: boolean;
}

export function computeEffectiveVisibility(
  defaults: Omit<CardVisibility, "blocked">,
  rule: CardAccessRule | null
): CardVisibility {
  if (rule?.blocked) {
    return {
      showDna: false,
      showPlayScore: false,
      showStreak: false,
      showAvatar3d: false,
      showZodiac: false,
      showBio: false,
      blocked: true,
    };
  }

  return {
    showDna: rule?.show_dna ?? defaults.showDna,
    showPlayScore: rule?.show_play_score ?? defaults.showPlayScore,
    showStreak: rule?.show_streak ?? defaults.showStreak,
    showAvatar3d: rule?.show_avatar_3d ?? defaults.showAvatar3d,
    showZodiac: rule?.show_zodiac ?? defaults.showZodiac,
    showBio: rule?.show_bio ?? defaults.showBio,
    blocked: false,
  };
}
