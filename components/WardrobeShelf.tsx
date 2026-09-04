"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { claimFreeItemAction, equipItemAction, type WardrobeSlot } from "@/lib/actions/wardrobe";
import { FlutterwaveCheckoutButton } from "@/components/FlutterwaveCheckoutButton";
import { buildWardrobeTxRef, FLUTTERWAVE_CURRENCY } from "@/lib/flutterwave";

export interface WardrobeItemRow {
  id: string;
  slot: WardrobeSlot;
  name: string;
  asset_url: string;
  price_cents: number | null;
  drop_expires_at: string | null;
}

const SLOT_META: Record<WardrobeSlot, { label: string; emoji: string }> = {
  headwear: { label: "Headwear", emoji: "🧢" },
  top: { label: "Top", emoji: "👕" },
  bottom: { label: "Bottom", emoji: "👖" },
  shoes: { label: "Shoes", emoji: "👟" },
  accessory: { label: "Accessory", emoji: "🕶️" },
};
const SLOT_ORDER: WardrobeSlot[] = ["headwear", "top", "bottom", "shoes", "accessory"];

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function WardrobeShelf({
  items,
  initialOwnedItemIds,
  initialOutfit,
  viewerId,
  viewerEmail,
  viewerUsername,
}: {
  items: WardrobeItemRow[];
  initialOwnedItemIds: string[];
  initialOutfit: Partial<Record<WardrobeSlot, string | null>>;
  viewerId: string;
  viewerEmail: string;
  viewerUsername: string;
}) {
  const [ownedIds, setOwnedIds] = useState(new Set(initialOwnedItemIds));
  const [outfit, setOutfit] = useState<Partial<Record<WardrobeSlot, string | null>>>(initialOutfit);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const bySlot = SLOT_ORDER.map((slot) => ({
    slot,
    items: items.filter((i) => i.slot === slot),
  })).filter((g) => g.items.length > 0);

  const handleTap = (item: WardrobeItemRow) => {
    if (item.price_cents !== null && !ownedIds.has(item.id)) return; // handled by the checkout button instead
    setError(null);
    const owned = ownedIds.has(item.id);
    const equipped = outfit[item.slot] === item.id;

    setPendingId(item.id);
    startTransition(async () => {
      try {
        if (equipped) {
          await equipItemAction(item.slot, null);
          setOutfit((prev) => ({ ...prev, [item.slot]: null }));
        } else if (owned) {
          await equipItemAction(item.slot, item.id);
          setOutfit((prev) => ({ ...prev, [item.slot]: item.id }));
        } else {
          await claimFreeItemAction(item.id);
          await equipItemAction(item.slot, item.id);
          setOwnedIds((prev) => new Set(prev).add(item.id));
          setOutfit((prev) => ({ ...prev, [item.slot]: item.id }));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface-raised p-4">
      <div>
        <p className="text-sm font-semibold text-text-secondary">Wardrobe</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          Try on pieces now — once full-body avatars ship, whatever you&apos;ve equipped here shows on your card automatically.
        </p>
      </div>

      {bySlot.map(({ slot, items: slotItems }) => (
        <div key={slot}>
          <p className="mb-1.5 text-xs font-semibold text-text-secondary">
            {SLOT_META[slot].emoji} {SLOT_META[slot].label}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {slotItems.map((item) => {
              const owned = ownedIds.has(item.id);
              const equipped = outfit[item.slot] === item.id;
              const busy = isPending && pendingId === item.id;
              const isExclusive = item.price_cents === null && item.drop_expires_at !== null;
              const purchasable = item.price_cents !== null && !owned;

              return (
                <div
                  key={item.id}
                  className={clsx(
                    "flex shrink-0 flex-col items-center gap-1 rounded-lg border-2 px-2 py-2",
                    equipped ? "border-accent bg-accent-soft" : "border-transparent bg-surface",
                    busy && "opacity-60"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleTap(item)}
                    disabled={busy || purchasable}
                    title={item.name}
                    className="flex flex-col items-center gap-1 transition-transform"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.asset_url} alt={item.name} width={44} height={44} className="h-11 w-11 rounded-md" />
                    <span className="max-w-[64px] truncate text-[10px] font-medium text-text-secondary">
                      {item.name}
                    </span>
                  </button>
                  {equipped ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold text-accent-contrast">
                      Equipped
                    </span>
                  ) : owned ? (
                    <button onClick={() => handleTap(item)} className="text-[9px] text-text-secondary">
                      Tap to equip
                    </button>
                  ) : item.price_cents !== null ? (
                    <FlutterwaveCheckoutButton
                      txRef={buildWardrobeTxRef(viewerId, item.id)}
                      amount={item.price_cents / 100}
                      currency={FLUTTERWAVE_CURRENCY}
                      customerEmail={viewerEmail}
                      customerName={viewerUsername}
                      title={item.name}
                      description={`This or That wardrobe — ${item.name}`}
                      buttonLabel={formatPrice(item.price_cents)}
                      onSubmitted={() =>
                        setNote("Payment sent — this item unlocks in your wardrobe within a minute or two.")
                      }
                    />
                  ) : isExclusive ? (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold text-accent">
                      Exclusive
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-bold text-green-600">
                      Free
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {note && <p className="text-xs font-medium text-accent">{note}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
