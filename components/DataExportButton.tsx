"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { exportMyDataAction } from "@/lib/actions/settings";

export function DataExportButton() {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const json = await exportMyDataAction();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "this-or-that-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" className="w-full" onClick={download} disabled={loading}>
      {loading ? "Preparing…" : "Download my data"}
    </Button>
  );
}
