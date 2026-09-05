"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PRO_PRICE, FLUTTERWAVE_CURRENCY, buildProTxRef } from "@/lib/flutterwave";

// Flutterwave's inline checkout attaches itself to window once its script
// loads - no npm package needed, matches the pattern their own docs use.
declare global {
  interface Window {
    FlutterwaveCheckout?: (config: {
      public_key: string;
      tx_ref: string;
      amount: number;
      currency: string;
      payment_options: string;
      customer: { email: string; name?: string };
      customizations: { title: string; description: string };
      callback: (response: { status: string }) => void;
      onclose: () => void;
    }) => void;
  }
}

export function UpgradeProButton({
  userId,
  userEmail,
  label = "Upgrade to TOT Pro",
}: {
  userId: string;
  userEmail: string;
  label?: string;
}) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

  const openCheckout = () => {
    if (!publicKey || !window.FlutterwaveCheckout) return;

    window.FlutterwaveCheckout({
      public_key: publicKey,
      tx_ref: buildProTxRef(userId),
      amount: PRO_PRICE,
      currency: FLUTTERWAVE_CURRENCY,
      payment_options: "card",
      customer: { email: userEmail },
      customizations: {
        title: "TOT Pro",
        description: "Premium card themes, deeper Preference DNA insights and more.",
      },
      callback: (response) => {
        if (response.status === "successful" || response.status === "completed") {
          // The webhook grants the actual entitlement server-side - this is
          // just giving the payer a moment before we refresh their profile.
          setStatus("processing");
          setTimeout(() => {
            setStatus("done");
            router.refresh();
          }, 3000);
        }
      },
      onclose: () => {},
    });
  };

  if (!publicKey) {
    return <p className="text-xs text-text-secondary">Pro upgrades aren&apos;t available yet - check back soon.</p>;
  }

  return (
    <>
      <Script
        src="https://checkout.flutterwave.com/v3.js"
        onReady={() => setScriptReady(true)}
        strategy="lazyOnload"
      />
      <Button onClick={openCheckout} disabled={!scriptReady || status === "processing"} size="sm">
        {status === "processing" ? "Activating Pro…" : status === "done" ? "Welcome to Pro!" : label}
      </Button>
    </>
  );
}
