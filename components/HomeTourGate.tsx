"use client";

import { useState } from "react";
import { AppTour } from "@/components/AppTour";
import { completeTourAction } from "@/lib/actions/tour";

export function HomeTourGate({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show);
  if (!visible) return null;

  return (
    <AppTour
      onComplete={() => {
        setVisible(false);
        completeTourAction();
      }}
    />
  );
}
