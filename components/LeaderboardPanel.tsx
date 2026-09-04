"use client";

import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Avatar } from "@/components/ui/Avatar";

interface LeaderboardRow {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  correct: number;
  total: number;
}

interface PlaySubject {
  slug: string;
  label: string;
  emoji: string;
  count: number;
}

type LeaderboardScope = "global" | "country" | "friends";

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardPanel({
  subject,
  subjects,
  rows,
  viewerId,
  scope,
  hasCountry,
}: {
  subject: string | null;
  subjects: PlaySubject[];
  rows: LeaderboardRow[];
  viewerId: string | null;
  scope: LeaderboardScope;
  hasCountry: boolean;
}) {
  const router = useRouter();

  const goMode = (m: "trivia" | "classic" | "predict") => router.push(`/play?mode=${m}`);
  const goSubject = (s: string | null) =>
    router.push(`/play?mode=leaderboard${s ? `&subject=${s}` : ""}${scope !== "global" ? `&scope=${scope}` : ""}`);
  const goScope = (s: LeaderboardScope) =>
    router.push(`/play?mode=leaderboard${subject ? `&subject=${subject}` : ""}${s !== "global" ? `&scope=${s}` : ""}`);

  return (
    <div className="flex h-full flex-col gap-4 px-4 pt-4" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
      <div className="flex shrink-0 items-center justify-between">
        <div className="glass flex items-center gap-1 rounded-full p-1">
          <ModePill active={false} onClick={() => goMode("trivia")}>
            🧠 Trivia
          </ModePill>
          <ModePill active={false} onClick={() => goMode("classic")}>
            🔀 Classic
          </ModePill>
          <ModePill active={false} onClick={() => goMode("predict")}>
            🔮 Predict
          </ModePill>
          <ModePill active>🏆</ModePill>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <SubjectPill active={scope === "global"} onClick={() => goScope("global")}>
          🌎 Global
        </SubjectPill>
        <SubjectPill active={scope === "country"} onClick={() => goScope("country")}>
          📍 My Country
        </SubjectPill>
        {viewerId && (
          <SubjectPill active={scope === "friends"} onClick={() => goScope("friends")}>
            👥 Friends
          </SubjectPill>
        )}
      </div>

      {scope === "country" && !hasCountry && (
        <p className="-mt-2 text-xs text-text-secondary">
          Set your country in Settings → Privacy to see this leaderboard.
        </p>
      )}

      <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
        <SubjectPill active={subject === null} onClick={() => goSubject(null)}>
          Overall
        </SubjectPill>
        {subjects.map((s) => (
          <SubjectPill key={s.slug} active={subject === s.slug} onClick={() => goSubject(s.slug)}>
            {s.emoji} {s.label}
          </SubjectPill>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pb-6">
        {rows.length === 0 ? (
          <p className="mt-10 text-center text-sm text-text-secondary">
            No scores yet for this {subject ? "subject" : "leaderboard"} — be the first to answer some trivia.
          </p>
        ) : (
          rows.map((row, i) => {
            const pct = row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
            const isMe = row.user_id === viewerId;
            return (
              <div
                key={row.user_id}
                className={clsx(
                  "glass flex items-center gap-3 rounded-2xl px-4 py-3",
                  isMe && "ring-2 ring-accent"
                )}
              >
                <span className="w-7 shrink-0 text-center text-sm font-bold text-text-secondary">
                  {MEDALS[i] ?? `#${i + 1}`}
                </span>
                <Avatar name={row.username} src={row.avatar_url} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {row.display_name || row.username}
                    {isMe && <span className="ml-1.5 text-xs font-medium text-accent">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-text-secondary">@{row.username}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-text-primary">
                    {row.correct}/{row.total}
                  </p>
                  <p className="text-xs text-text-secondary">{pct}%</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ModePill({ active, onClick, children }: { active: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "tap-scale rounded-full px-4 py-2 text-sm font-bold transition-colors",
        active ? "accent-gradient text-white" : "text-text-secondary"
      )}
    >
      {children}
    </button>
  );
}

function SubjectPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "tap-scale glass shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold",
        active ? "text-accent" : "text-text-secondary"
      )}
    >
      {children}
    </button>
  );
}
