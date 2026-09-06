import { clsx } from "clsx";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export interface VoteResultBarOption {
  id: string;
  label: string;
  pct: number;
  isWinner: boolean;
}

/**
 * One continuous bar split into proportional segments, replacing the
 * per-tile floating percentage pill with a real result visualization -
 * shown once a comparison has votes to show.
 */
export function VoteResultBar({ options }: { options: VoteResultBarOption[] }) {
  return (
    <div className="shrink-0">
      <div className="flex h-2 gap-[3px] overflow-hidden rounded-full">
        {options.map((option) => (
          <div
            key={option.id}
            className={clsx("h-full rounded-full transition-all", option.isWinner ? "bg-accent" : "bg-white/15")}
            style={{ flexBasis: `${Math.max(option.pct, 3)}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
        {options.map((option, i) => (
          <span key={option.id} className="flex items-center gap-1 text-xs text-text-secondary">
            <span className="font-bold text-text-primary/70">{i + 1}</span>
            <span className="max-w-[110px] truncate">{option.label}</span>
            <span className={clsx("font-bold", option.isWinner ? "text-accent" : "text-text-secondary")}>
              <AnimatedNumber value={option.pct} />%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
