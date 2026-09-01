"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { formatTimeLeft } from "@/lib/countdown";

export interface StoryItem {
  id: string;
  heading: string;
  expiresAt: string;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
}

export function StoriesRail({ stories }: { stories: StoryItem[] }) {
  return (
    <div className="shrink-0 overflow-x-auto border-b border-border px-4 py-3">
      <div className="flex gap-4">
        {stories.map((story) => {
          const timeLeft = formatTimeLeft(story.expiresAt);
          return (
            <Link
              key={story.id}
              href={`/comparison/${story.id}`}
              className="tap-scale flex w-16 shrink-0 flex-col items-center gap-1 text-center"
            >
              <span className="rounded-full bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-2)_100%)] p-[2.5px]">
                <span className="block rounded-full bg-background p-[2px]">
                  <Avatar name={story.creatorUsername ?? "?"} src={story.creatorAvatarUrl} size={52} />
                </span>
              </span>
              <span className="line-clamp-1 w-full text-[11px] font-medium text-text-secondary">
                {timeLeft ?? "Ending"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
