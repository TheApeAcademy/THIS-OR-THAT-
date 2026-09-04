"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface InsightsData {
  viewCount: number;
  dailyVotes: { day: string; votes: number }[];
}

export function CreatorInsights({ insights }: { insights: InsightsData }) {
  const [open, setOpen] = useState(false);

  const chartData = insights.dailyVotes.map((d) => ({
    ...d,
    label: new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tap-scale flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-text-secondary">
          Insights · {insights.viewCount} views
        </span>
        <span className="text-xs text-text-secondary">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="mt-3">
          {chartData.length === 0 ? (
            <p className="text-xs text-text-secondary">No votes yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-secondary)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="votes" stroke="var(--accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
