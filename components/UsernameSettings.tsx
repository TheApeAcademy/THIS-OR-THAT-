"use client";

import { useEffect, useState, useTransition } from "react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { checkUsernameAction, updateUsernameAction, type UsernameCheckResult } from "@/lib/actions/username";
import { SPRING_BOUNCY, SPRING_SNAPPY } from "@/lib/motion";

const TIER_LABEL: Record<UsernameCheckResult["tier"], string> = {
  free: "Free",
  premium: "Premium",
  rare: "Rare",
};

export function UsernameSettings({ currentUsername, onClose }: { currentUsername: string; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [check, setCheck] = useState<UsernameCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Debounced availability check against the server as the user types —
    // a deliberate effect syncing to an external async call, not state
    // mirroring.
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || trimmed === currentUsername) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheck(null);
      return;
    }
    setChecking(true);
    const handle = setTimeout(async () => {
      const result = await checkUsernameAction(trimmed);
      setCheck(result);
      setChecking(false);
    }, 400);
    return () => clearTimeout(handle);
  }, [value, currentUsername]);

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateUsernameAction(value);
        setSaved(true);
        setValue("");
        setCheck(null);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  const isFree = check?.valid && check.available && check.tier === "free";
  const isPremium = check?.valid && check.tier !== "free";

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-text-secondary">Change username</p>
        <p className="text-xs text-text-secondary">
          Currently @{currentUsername}. Shorter handles are rarer — pricing shown below for those.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-text-secondary">@</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase())}
          placeholder="newusername"
          maxLength={20}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
      </div>

      <AnimatePresence>
        {checking && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-text-secondary"
          >
            Checking…
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!checking && check && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={SPRING_SNAPPY}
            className="flex items-center gap-2"
          >
            <span
              className={clsx(
                "rounded-full px-2.5 py-1 text-xs font-bold",
                check.valid && check.available ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-600"
              )}
            >
              {check.valid && check.available ? "Available" : (check.reason ?? "Unavailable")}
            </span>
            {check.valid && check.tier !== "free" && (
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">
                {TIER_LABEL[check.tier]} · ${check.price}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isPremium && check?.available && (
        <p className="text-xs text-text-secondary">
          Premium usernames aren&apos;t purchasable yet — payments are launching soon.
        </p>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        {isPremium ? (
          <Button className="flex-1" disabled>
            Buy for ${check?.price} — coming soon
          </Button>
        ) : (
          <Button className="flex-1" onClick={save} disabled={!isFree || isPending}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={isPending ? "saving" : saved ? "saved" : "save"}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.9 }}
                transition={SPRING_BOUNCY}
                className="inline-block"
              >
                {isPending ? "Saving…" : saved ? "Saved!" : "Save username"}
              </motion.span>
            </AnimatePresence>
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            setValue("");
            setCheck(null);
            setError(null);
            onClose();
          }}
        >
          Close
        </Button>
      </div>
    </div>
  );
}
