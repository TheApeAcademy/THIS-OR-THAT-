"use client";

import { useState, type ReactNode } from "react";
import { Tabs } from "@/components/ui/Tabs";

const OPTIONS = [
  { value: "reports", label: "Reports" },
  { value: "metrics", label: "Metrics" },
  { value: "audit", label: "Audit log" },
];

export function AdminTabs({
  reports,
  metrics,
  audit,
}: {
  reports: ReactNode;
  metrics: ReactNode;
  audit: ReactNode;
}) {
  const [tab, setTab] = useState("reports");

  return (
    <div className="space-y-4">
      <Tabs options={OPTIONS} value={tab} onChange={setTab} />
      {tab === "reports" && reports}
      {tab === "metrics" && metrics}
      {tab === "audit" && audit}
    </div>
  );
}
