"use client";

import { SwipeCard, type SwipeCardOption } from "@/components/SwipeCard";

export interface SwipeDeckItem {
  id: string;
  optionA: SwipeCardOption;
  optionB: SwipeCardOption;
}

interface SwipeDeckProps {
  queue: SwipeDeckItem[];
  index: number;
  onVote: (comparisonId: string, optionId: string) => void;
}

const STACK_DEPTH = 3;

export function SwipeDeck({ queue, index, onVote }: SwipeDeckProps) {
  const visible = queue.slice(index, index + STACK_DEPTH).map((item, i) => ({ item, i }));

  return (
    <div className="relative flex-1">
      {[...visible].reverse().map(({ item, i }) => (
        <div
          key={item.id}
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{
            transform: `translateY(${i * 10}px) scale(${1 - i * 0.04})`,
            zIndex: visible.length - i,
          }}
        >
          <SwipeCard
            optionA={item.optionA}
            optionB={item.optionB}
            active={i === 0}
            onVote={(optionId) => onVote(item.id, optionId)}
          />
        </div>
      ))}
    </div>
  );
}
