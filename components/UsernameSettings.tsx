"use client";

import { useEffect, useState, useTransition } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { checkUsernameAction, updateUsernameAction, type UsernameCheckResult } from "@/lib/actions/username";

const TIER_LABEL: Record<UsernameCheckResult["tier"], string> = {
  free: "Free",
  premium: "Premium",
  rare: "Rare",
};

export function UsernameSettings({ currentUsername }: { currentUsername: string }) {
  const [open, setOpen] = useState(false);
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

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        Change username (@{currentUsername})
      </Button>
    );
  }

  const isFree = check?.valid && check.available && check.tier === "free";
  const isPremium = check?.valid && check.tier !== "free";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
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

      {checking && <p className="text-xs text-text-secondary">Checking…</p>}

      {!checking && check && (
        <div className="flex items-center gap-2">
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
        </div>
      )}

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
            {isPending ? "Saving…" : saved ? "Saved!" : "Save username"}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(false);
            setValue("");
            setCheck(null);
            setError(null);
          }}
        >
          Close
        </Button>
      </div>
    </div>
  );
}
