const ACHIEVEMENT_META: Record<string, { emoji: string; label: string }> = {
  first_vote: { emoji: "🗳️", label: "First Vote" },
  first_comment: { emoji: "💬", label: "First Comment" },
  first_comparison: { emoji: "✨", label: "First Debate" },
  streak_3: { emoji: "🔥", label: "3-Day Streak" },
  streak_7: { emoji: "🔥", label: "7-Day Streak" },
  trivia_master: { emoji: "🧠", label: "Trivia Master" },
};

export function AchievementBadges({ types }: { types: string[] }) {
  if (types.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-lg font-semibold text-text-primary">Achievements</p>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const meta = ACHIEVEMENT_META[type];
          if (!meta) return null;
          return (
            <span
              key={type}
              className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-text-primary"
            >
              <span>{meta.emoji}</span>
              {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
