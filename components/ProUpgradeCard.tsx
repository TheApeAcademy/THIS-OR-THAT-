"use client";

import { useState } from "react";
import { FlutterwaveCheckoutButton } from "@/components/FlutterwaveCheckoutButton";
import { buildProTxRef, PRO_PRICE, FLUTTERWAVE_CURRENCY } from "@/lib/flutterwave";

export function ProUpgradeCard({
  viewerId,
  viewerEmail,
  viewerUsername,
  isPro,
  proExpiresAt,
}: {
  viewerId: string;
  viewerEmail: string;
  viewerUsername: string;
  isPro: boolean;
  proExpiresAt: string | null;
}) {
  const [note, setNote] = useState<string | null>(null);

  if (isPro) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/10 p-4">
        <p className="text-sm font-bold text-accent">⭐ This or That Pro</p>
        <p className="mt-1 text-xs text-text-secondary">
          {proExpiresAt
            ? `Active until ${new Date(proExpiresAt).toLocaleDateString()}.`
            : "Active."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <div>
        <p className="text-sm font-bold text-text-primary">⭐ Upgrade to Pro</p>
        <p className="mt-1 text-xs text-text-secondary">
          Premium card themes, deeper Preference DNA history, and advanced compatibility — ${PRO_PRICE}/month.
        </p>
      </div>
      <FlutterwaveCheckoutButton
        txRef={buildProTxRef(viewerId)}
        amount={PRO_PRICE}
        currency={FLUTTERWAVE_CURRENCY}
        customerEmail={viewerEmail}
        customerName={viewerUsername}
        title="This or That Pro"
        description="Monthly Pro subscription"
        buttonLabel={`Upgrade — $${PRO_PRICE}/mo`}
        onSubmitted={() => setNote("Payment sent — Pro activates within a minute or two.")}
      />
      {note && <p className="text-xs font-medium text-accent">{note}</p>}
    </div>
  );
}
