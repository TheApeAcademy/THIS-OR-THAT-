"use client";

import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { SPRING_BOUNCY } from "@/lib/motion";
import { updateProfileCardAction, type SocialLinks } from "@/lib/actions/profile";
import { CardRevealCard } from "@/components/CardRevealCard";

interface RevealData {
  username: string;
  displayName: string | null;
  profilePhotoUrl: string | null;
  avatarModelUrl: string | null;
  topRows: { slug: string; label: string; emoji: string | null }[];
}

const AvaturnAvatarCreator = dynamic(
  () => import("@/components/AvaturnAvatarCreator").then((m) => m.AvaturnAvatarCreator),
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
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"editing" | "revealing">("editing");
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [revealDone, setRevealDone] = useState(false);

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
    setFinishError(null);
    startTransition(async () => {
      try {
        await updateProfileCardAction(bio, links);

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          onFinish();
          return;
        }

        const [{ data: profile }, { data: dna }, { data: categories }] = await Promise.all([
          supabase.from("profiles").select("username, display_name, profile_photo_url, avatar_model_url").eq("id", user.id).single(),
          supabase.from("preference_dna").select("breakdown").eq("user_id", user.id).maybeSingle(),
          supabase.from("categories").select("slug, label, emoji"),
        ]);

        const categoryMeta = new Map((categories ?? []).map((c) => [c.slug, c]));
        const breakdown = (dna?.breakdown ?? {}) as Record<string, { pct: number }>;
        const topRows = Object.entries(breakdown)
          .map(([slug, v]) => ({
            slug,
            label: categoryMeta.get(slug)?.label ?? slug,
            emoji: categoryMeta.get(slug)?.emoji ?? null,
            pct: v.pct,
          }))
          .sort((a, b) => b.pct - a.pct);

        setRevealData({
          username: profile?.username ?? "you",
          displayName: profile?.display_name ?? null,
          profilePhotoUrl: profile?.profile_photo_url ?? null,
          avatarModelUrl: profile?.avatar_model_url ?? null,
          topRows,
        });
        setPhase("revealing");
      } catch {
        setFinishError("Couldn't save your profile — try again.");
      }
    });
  };

  if (phase === "revealing" && revealData) {
    return (
      <div
        className="flex h-[100dvh] flex-col items-center justify-center gap-6 px-6 pb-10"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="text-center">
          <p className="text-2xl font-extrabold tracking-tight text-text-primary">Meet your TOT card</p>
          <p className="mt-1 text-sm text-text-secondary">This is you — share it instead of a phone number.</p>
        </div>
        <CardRevealCard
          username={revealData.username}
          displayName={revealData.displayName}
          bio={bio}
          profilePhotoUrl={revealData.profilePhotoUrl}
          avatarModelUrl={revealData.avatarModelUrl}
          topRows={revealData.topRows}
          onRevealComplete={() => setRevealDone(true)}
        />
        {revealDone && (
          <Button className="w-full max-w-sm" onClick={onFinish}>
            Continue
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex h-[100dvh] flex-col gap-5 overflow-y-auto px-6 pb-10"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)" }}
    >
      <div>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING_BOUNCY}
          className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success"
        >
          <CheckIcon size={22} />
        </motion.div>
        <p className="text-2xl font-extrabold tracking-tight text-text-primary">Almost there</p>
        <p className="mt-2 text-text-secondary">Your Preference DNA is building. Give your card a final touch.</p>
      </div>

      <AvaturnAvatarCreator variant="inline" onSaved={() => setAvatarSaved(true)} />
      {avatarSaved && <p className="text-sm font-medium text-accent">Avatar saved ✓</p>}

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

      <div className="mt-auto space-y-2">
        {finishError && <p className="text-sm text-danger">{finishError}</p>}
        <Button className="w-full" onClick={finish} disabled={isPending}>
          {isPending ? "Finishing…" : "Finish setting up"}
        </Button>
      </div>
    </div>
  );
}
