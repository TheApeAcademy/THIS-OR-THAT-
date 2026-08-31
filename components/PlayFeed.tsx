"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { AnimatePresence, motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { SquircleTile } from "@/components/SquircleTile";
import { Button } from "@/components/ui/Button";
import { voteAction } from "@/lib/actions/vote";
import { recordPlayAnswerAction } from "@/lib/actions/playAnswer";
import type { PlayCardData } from "@/lib/playFeed";

const VOTE_DISTANCE_THRESHOLD = 110;
const VOTE_VELOCITY_THRESHOLD = 450;
const ADVANCE_DELAY_MS = 1500;

interface PlaySubject {
  slug: string;
  label: string;
  emoji: string;
  count: number;
}

export function PlayFeed({
  queue,
  mode,
  subject,
  subjects,
  score,
  isAuthed,
}: {
  queue: PlayCardData[];
  mode: "trivia" | "classic";
  subject: string | null;
  subjects: PlaySubject[];
  score: { correct: number; total: number };
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [scoreState, setScoreState] = useState(score);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [, startTransition] = useTransition();

  const card = queue[index];
  const done = index >= queue.length;

  const buzz = (ms: number | number[]) => {
    try {
      navigator.vibrate?.(ms);
    } catch {
      // unsupported — ignore
    }
  };

  const handleAnswer = (comparisonId: string, optionId: string, correct: boolean | null, cardSubject: string | null) => {
    if (correct === true) {
      setScoreState((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
      buzz([12, 40, 12]);
    } else if (correct === false) {
      setScoreState((s) => ({ ...s, total: s.total + 1 }));
      setStreak(0);
      buzz(50);
    } else {
      // Classic mode: comparisons have no right/wrong answer, so there's no
      // real streak to track here — leave streak/bestStreak untouched.
      buzz(14);
    }

    if (isAuthed) {
      startTransition(async () => {
        try {
          await voteAction(comparisonId, optionId);
        } catch {
          // best-effort in Play mode — the round already advanced
        }
        if (cardSubject) {
          try {
            await recordPlayAnswerAction(comparisonId, cardSubject, correct);
          } catch {
            // best-effort
          }
        }
      });
    }

    setTimeout(() => setIndex((i) => i + 1), ADVANCE_DELAY_MS);
  };

  const goMode = (m: "trivia" | "classic") => {
    router.push(m === "classic" ? "/play?mode=classic" : "/play?mode=trivia");
  };

  const goSubject = (s: string | null) => {
    router.push(s ? `/play?mode=trivia&subject=${s}` : "/play?mode=trivia");
  };

  return (
    <div className="flex h-full flex-col gap-4 px-4 pt-4" style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}>
      <div className="flex shrink-0 items-center justify-between">
        <div className="glass flex items-center gap-1 rounded-full p-1">
          <ModePill active={mode === "trivia"} onClick={() => goMode("trivia")}>
            🧠 Trivia
          </ModePill>
          <ModePill active={mode === "classic"} onClick={() => goMode("classic")}>
            🔀 Classic
          </ModePill>
          <ModePill active={false} onClick={() => router.push(subject ? `/play?mode=leaderboard&subject=${subject}` : "/play?mode=leaderboard")}>
            🏆
          </ModePill>
        </div>
        <div className="flex items-center gap-2">
          {mode === "trivia" && scoreState.total > 0 && (
            <span className="glass rounded-full px-3 py-1.5 text-xs font-bold text-text-primary">
              ✅ {scoreState.correct}/{scoreState.total}
            </span>
          )}
          <AnimatePresence>
            {streak > 0 && (
              <motion.span
                key={streak}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 16 }}
                className="glass rounded-full px-3 py-1.5 text-xs font-bold text-accent"
              >
                🔥 {streak}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {mode === "trivia" && subjects.length > 0 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
          <SubjectPill active={subject === null} onClick={() => goSubject(null)}>
            All
          </SubjectPill>
          {subjects.map((s) => (
            <SubjectPill key={s.slug} active={subject === s.slug} onClick={() => goSubject(s.slug)}>
              {s.emoji} {s.label} · {s.count}
            </SubjectPill>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden">
        {done ? (
          <EndOfQueue
            correct={scoreState.correct}
            total={scoreState.total}
            bestStreak={bestStreak}
            mode={mode}
            onPlayAgain={() => {
              // router.refresh() re-fetches the server queue but doesn't
              // remount this component (the page's key only changes with
              // mode/subject), so per-round state has to be reset by hand
              // or the old index/streak persist against the fresh queue.
              setIndex(0);
              setStreak(0);
              setBestStreak(0);
              router.refresh();
            }}
          />
        ) : (
          <PlayCard
            key={card.id}
            card={card}
            onAnswer={(optionId, correct) => handleAnswer(card.id, optionId, correct, card.subject)}
          />
        )}
      </div>
    </div>
  );
}

function PlayCard({ card, onAnswer }: { card: PlayCardData; onAnswer: (optionId: string, correct: boolean | null) => void }) {
  const [answered, setAnswered] = useState(false);
  const [chosenId, setChosenId] = useState<string | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-10, 10]);
  const leftGlow = useTransform(x, [-160, 0], [0.85, 0]);
  const rightGlow = useTransform(x, [0, 160], [0, 0.85]);

  const [a, b] = card.options;
  const correctId = card.correctSide === "a" ? a.id : card.correctSide === "b" ? b.id : null;

  const pick = (optionId: string) => {
    if (answered) return;
    setAnswered(true);
    setChosenId(optionId);
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    const correct = correctId ? optionId === correctId : null;
    onAnswer(optionId, correct);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (answered) return;
    if (info.offset.x < -VOTE_DISTANCE_THRESHOLD || info.velocity.x < -VOTE_VELOCITY_THRESHOLD) {
      pick(a.id);
    } else if (info.offset.x > VOTE_DISTANCE_THRESHOLD || info.velocity.x > VOTE_VELOCITY_THRESHOLD) {
      pick(b.id);
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  const tint = (optionId: string) => {
    if (!answered || !correctId) return undefined;
    if (optionId === correctId) return "#22c55e";
    if (optionId === chosenId) return "#ef4444";
    return undefined;
  };

  const result = answered && correctId ? (chosenId === correctId ? "correct" : "incorrect") : null;

  return (
    <motion.div
      animate={result === "incorrect" ? { x: [0, -14, 14, -10, 10, 0] } : undefined}
      transition={{ duration: 0.4 }}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <motion.div
        drag={answered ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        style={{ x, rotate }}
        onDragEnd={handleDragEnd}
        className="relative grid grid-cols-2 gap-3"
      >
        <SquircleTile
          option={a}
          onTap={() => pick(a.id)}
          glow={leftGlow}
          hasVoted={answered}
          chosen={answered && chosenId === a.id}
          resultTint={tint(a.id)}
        />
        <SquircleTile
          option={b}
          onTap={() => pick(b.id)}
          glow={rightGlow}
          hasVoted={answered}
          chosen={answered && chosenId === b.id}
          resultTint={tint(b.id)}
        />
      </motion.div>

      <p className="text-center text-3xl font-black leading-[1.1] tracking-tight text-text-primary">
        {card.prompt || `${a.label} or ${b.label}?`}
      </p>

      <AnimatePresence>
        {answered && (
          <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {result && (
              <motion.span
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1.4, opacity: [0, 1, 0] }}
                transition={{ duration: 1 }}
                className="text-8xl"
              >
                {result === "correct" ? "🎉" : "😬"}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {answered && card.funFact && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 26, delay: 0.15 }}
            className="glass rounded-2xl px-4 py-3"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-accent">
              {result === "correct" ? "✅ Correct!" : result === "incorrect" ? "❌ Not quite" : "💡 Did you know?"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-primary">{card.funFact}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EndOfQueue({
  correct,
  total,
  bestStreak,
  mode,
  onPlayAgain,
}: {
  correct: number;
  total: number;
  bestStreak: number;
  mode: "trivia" | "classic";
  onPlayAgain: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="glass flex flex-col items-center gap-3 rounded-3xl px-8 py-10 text-center"
    >
      <p className="text-4xl">🎉</p>
      <p className="text-xl font-extrabold text-text-primary">You&apos;re all caught up!</p>
      {mode === "trivia" && total > 0 && (
        <p className="text-text-secondary">
          Scored <span className="font-bold text-text-primary">{correct}/{total}</span> this round
        </p>
      )}
      {bestStreak > 1 && <p className="text-text-secondary">🔥 Best streak: {bestStreak}</p>}
      <Button className="mt-2" onClick={onPlayAgain}>
        Play again
      </Button>
    </motion.div>
  );
}

function ModePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
