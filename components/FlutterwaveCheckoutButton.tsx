"use client";

import { useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/Button";

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: Record<string, unknown>) => void;
  }
}

export function FlutterwaveCheckoutButton({
  txRef,
  amount,
  currency,
  customerEmail,
  customerName,
  title,
  description,
  buttonLabel,
  onSubmitted,
}: {
  txRef: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  title: string;
  description: string;
  buttonLabel: string;
  /** Fires once the checkout closes after a submitted payment — the actual
   * entitlement grant happens asynchronously via the flutterwave-webhook
   * edge function, not this callback, so treat this as "payment sent" and
   * not "you now have access." */
  onSubmitted?: () => void;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

  const pay = () => {
    if (!publicKey || !window.FlutterwaveCheckout) return;
    setLoading(true);
    window.FlutterwaveCheckout({
      public_key: publicKey,
      tx_ref: txRef,
      amount,
      currency,
      payment_options: "card,mobilemoney,ussd",
      customer: { email: customerEmail, name: customerName },
      customizations: { title, description },
      callback: () => {
        setLoading(false);
        onSubmitted?.();
      },
      onclose: () => {
        setLoading(false);
      },
    });
  };

  if (!publicKey) {
    return <p className="text-xs text-text-secondary">Payments aren&rsquo;t configured yet.</p>;
  }

  return (
    <>
      <Script src="https://checkout.flutterwave.com/v3.js" onReady={() => setScriptReady(true)} />
      <Button size="sm" onClick={pay} disabled={loading || !scriptReady}>
        {loading ? "Processing…" : buttonLabel}
      </Button>
    </>
  );
}
