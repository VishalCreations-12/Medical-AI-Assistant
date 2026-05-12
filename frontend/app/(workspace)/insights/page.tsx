"use client";

import { useEffect, useState } from "react";
import { formatInr } from "@/lib/format";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { insightsApi } from "@/services/api";
import type { InsightsBundle } from "@/types";

export default function InsightsPage() {
  const [bundle, setBundle] = useState<InsightsBundle | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const b = await insightsApi.get();
        setBundle(b);
      } catch {
        setBundle(null);
      }
    })();
  }, []);

  const trendData =
    bundle?.trends?.map((t) => ({
      month: t.month,
      movement: t.netChange,
    })) ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Smart insights</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Inventory intelligence synthesizes stock posture, consumption proxies, and
          replenishment economics.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[var(--border)] lg:col-span-2">
          <CardHeader>
            <CardTitle>Reorder recommendations</CardTitle>
            <CardDescription>
              Ranked recommendations emphasize urgency and estimated landed acquisition
              costs.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {(bundle?.recommendations ?? []).map((r) => (
              <div
                key={r.productId}
                className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{r.sku}</div>
                  </div>
                  <Badge variant={r.urgency === "high" ? "warning" : "secondary"}>
                    {r.urgency}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">{r.reason}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                  <span>
                    Suggested qty{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {r.suggestedQty}
                    </span>
                  </span>
                  <span>
                    Est. spend{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {formatInr(r.estimatedCost)}
                    </span>
                  </span>
                </div>
              </div>
            ))}
            {(bundle?.recommendations?.length ?? 0) === 0 ? (
              <div className="text-sm text-[var(--muted-foreground)]">
                Recommendations appear when SKUs trend toward policy limits.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-[var(--border)]">
          <CardHeader>
            <CardTitle>Stock-out horizon signals</CardTitle>
            <CardDescription>
              Directional horizon estimates grounded in recent consumption pacing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(bundle?.lowStockPredictions ?? []).map((p) => (
              <div
                key={p.productId}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Confidence {p.confidence}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{p.daysUntilStockout}d</div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    Horizon
                  </div>
                </div>
              </div>
            ))}
            {(bundle?.lowStockPredictions?.length ?? 0) === 0 ? (
              <div className="text-sm text-[var(--muted-foreground)]">
                No elevated stock-out risk surfaced for the active catalog snapshot.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-[var(--border)]">
          <CardHeader>
            <CardTitle>Movement trend</CardTitle>
            <CardDescription>
              Net inventory deltas inferred from recorded stock movements.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {trendData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                Trends strengthen as movement history accumulates.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatInr(Number(value))} />
                  <Line
                    type="monotone"
                    dataKey="movement"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
