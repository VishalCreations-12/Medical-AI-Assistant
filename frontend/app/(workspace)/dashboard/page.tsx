"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { formatInr } from "@/lib/format";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Boxes, DollarSign, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi, insightsApi } from "@/services/api";
import type { DashboardSummary, InsightsBundle } from "@/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [insights, setInsights] = useState<InsightsBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [s, i] = await Promise.all([
          dashboardApi.summary(),
          insightsApi.get(),
        ]);
        if (!cancelled) {
          setSummary(s);
          setInsights(i);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load dashboard metrics.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const spendSeries =
    summary?.monthlySpend?.map((m) => ({
      month: m.month,
      spend: m.value,
    })) ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Operations overview
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Inventory valuation, procurement tempo, and predictive signals updated as your
          teams move stock.
        </p>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          <CardHeader>
            <CardTitle className="text-base">Heads up</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Inventory value"
          value={summary ? formatInr(summary.inventoryValue) : "—"}
          hint="On-hand valuation"
          icon={<DollarSign className="size-4" />}
        />
        <MetricCard
          title="Tracked SKUs"
          value={summary ? String(summary.skuCount) : "—"}
          hint="Across active catalogs"
          icon={<Boxes className="size-4" />}
        />
        <MetricCard
          title="Low stock SKUs"
          value={summary ? String(summary.lowStockCount) : "—"}
          hint="Below reorder policies"
          icon={<AlertTriangle className="size-4" />}
          accent="warning"
        />
        <MetricCard
          title="Open purchase orders"
          value={summary ? String(summary.openOrders) : "—"}
          hint="Awaiting closure"
          icon={<ShoppingCart className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-[var(--border)] lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly procurement spend</CardTitle>
            <CardDescription>
              Aggregated purchase order totals by calendar month.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {spendSeries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                Chart populates once orders carry historical totals.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendSeries}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatInr(Number(value))} />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorSpend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] lg:col-span-2">
          <CardHeader>
            <CardTitle>Priority reorders</CardTitle>
            <CardDescription>
              Pulled from inventory intelligence based on thresholds and velocity cues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(insights?.recommendations ?? []).slice(0, 4).map((r) => (
              <div
                key={r.productId}
                className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{r.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{r.sku}</div>
                  </div>
                  <Badge
                    variant={
                      r.urgency === "high"
                        ? "warning"
                        : r.urgency === "medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {r.urgency}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Suggested qty{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {r.suggestedQty}
                  </span>{" "}
                  · est. {formatInr(r.estimatedCost)}
                </div>
              </div>
            ))}
            {(insights?.recommendations?.length ?? 0) === 0 ? (
              <div className="text-sm text-[var(--muted-foreground)]">
                Inventory levels look balanced against current policies.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--border)]">
        <CardHeader>
          <CardTitle>Category allocation</CardTitle>
          <CardDescription>
            Inventory valuation concentration across therapeutic and operational groups.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {(summary?.categoryMix ?? []).map((c) => (
            <div
              key={c.category}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <span className="font-medium">{c.category}</span>
              <span className="text-[var(--muted-foreground)]">
                {formatInr(c.value)}
              </span>
            </div>
          ))}
          {(summary?.categoryMix?.length ?? 0) === 0 ? (
            <div className="text-sm text-[var(--muted-foreground)]">
              Category valuation appears once products are allocated.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard(props: {
  title: string;
  value: string;
  hint: string;
  icon: ReactNode;
  accent?: "warning";
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
          {props.title}
        </CardTitle>
        <div
          className={
            props.accent === "warning"
              ? "rounded-full bg-amber-500/15 p-2 text-amber-700 dark:text-amber-300"
              : "rounded-full bg-[var(--secondary)] p-2 text-[var(--secondary-foreground)]"
          }
        >
          {props.icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{props.value}</div>
        <p className="text-xs text-[var(--muted-foreground)]">{props.hint}</p>
      </CardContent>
    </Card>
  );
}
