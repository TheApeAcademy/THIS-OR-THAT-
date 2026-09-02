// Honest, non-alarmist nudge - no false "X hours left" countdown, since
// per-user timezone isn't tracked. Shown when the viewer hasn't voted yet
// today and would otherwise lose a real streak.
export function StreakRiskBanner({ streak, hasFreeze }: { streak: number; hasFreeze: boolean }) {
  return (
    <div className="mx-4 mt-2 flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2">
      <span className="text-lg">🔥</span>
      <p className="flex-1 text-sm font-semibold text-text-primary">
        {hasFreeze
          ? `Keep your ${streak}-day streak going - vote today (you've got a freeze banked if you forget).`
          : `Don't lose your ${streak}-day streak - vote today!`}
      </p>
    </div>
  );
}
