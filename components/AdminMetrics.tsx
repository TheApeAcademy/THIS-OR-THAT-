"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { AdminDailyStat, AdminSummaryStats } from "@/lib/actions/admin";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3 text-center">
      <p className="text-xl font-bold text-text-primary">{value.toLocaleString()}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}

function shortDay(day: string) {
  return new Date(day).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AdminMetrics({
  daily,
  summary,
}: {
  daily: AdminDailyStat[];
  summary: AdminSummaryStats | null;
}) {
  const chartData = daily.map((d) => ({ ...d, label: shortDay(d.day) }));

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="DAU" value={summary.dau} />
          <StatTile label="WAU" value={summary.wau} />
          <StatTile label="MAU" value={summary.mau} />
          <StatTile label="Users" value={summary.totalUsers} />
          <StatTile label="Debates" value={summary.totalComparisons} />
          <StatTile label="Votes" value={summary.totalVotes} />
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-raised p-3">
        <p className="mb-2 text-sm font-semibold text-text-secondary">Active users, last 14 days</p>
        <ResponsiveContainer width="100%" height={180}>
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
            <Line type="monotone" dataKey="activeUsers" name="Active users" stroke="var(--accent)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-3">
        <p className="mb-2 text-sm font-semibold text-text-secondary">Activity, last 14 days</p>
        <ResponsiveContainer width="100%" height={200}>
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
            <Line type="monotone" dataKey="votes" name="Votes" stroke="var(--accent)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="comments" name="Comments" stroke="var(--accent-2)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="newSignups" name="Signups" stroke="#a78bfa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
