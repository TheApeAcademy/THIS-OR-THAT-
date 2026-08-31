"use client";

import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { updateProfileCardAction, type SocialLinks } from "@/lib/actions/profile";

const RpmAvatarCreator = dynamic(
  () => import("@/components/RpmAvatarCreator").then((m) => m.RpmAvatarCreator),
  { ssr: false }
);

interface AiBioResult {
  bio?: string | null;
  needsMoreAnswers?: boolean;
  message?: string;
  error?: string;
}

export function OnboardingReview({ onFinish }: { onFinish: () => void }) {
  const [aiBio, setAiBio] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<SocialLinks>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.functions.invoke<AiBioResult>("summarize-profile-answers");
        if (!cancelled && data?.bio) {
          setAiBio(data.bio);
          setBio(data.bio);
        }
      } catch {
        // no bio yet — not a blocker
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = () => {
    startTransition(async () => {
      await updateProfileCardAction(bio, links);
      onFinish();
    });
  };

  return (
    <div
      className="flex h-[100dvh] flex-col gap-5 overflow-y-auto px-6 pb-10"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)" }}
    >
      <div>
        <p className="text-2xl font-extrabold tracking-tight text-text-primary">🎉 Almost there</p>
        <p className="mt-2 text-text-secondary">Your Preference DNA is building. Give your card a final touch.</p>
      </div>

      <RpmAvatarCreator variant="inline" onSaved={() => {}} />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-secondary">Your bio</p>
        {generating && !aiBio && <p className="text-sm text-text-secondary">Writing your bio…</p>}
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="A short line about you (shown on your card)"
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-secondary">Add a social link (optional)</p>
        <input
          value={links.instagram ?? ""}
          onChange={(e) => setLinks((prev) => ({ ...prev, instagram: e.target.value }))}
          placeholder="Instagram handle"
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="mt-auto">
        <Button className="w-full" onClick={finish} disabled={isPending}>
          {isPending ? "Finishing…" : "Finish setting up"}
        </Button>
      </div>
    </div>
  );
}
