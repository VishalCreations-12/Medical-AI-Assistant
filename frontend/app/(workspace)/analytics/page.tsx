"use client";

import { useEffect, useState } from "react";
import { formatInr } from "@/lib/format";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/services/api";
import type { DashboardSummary } from "@/types";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const s = await dashboardApi.summary();
        setSummary(s);
      } catch {
        setSummary(null);
      }
    })();
  }, []);

  const mix =
    summary?.categoryMix?.map((c) => ({
      category: c.category,
      value: Math.round(c.value),
    })) ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Blended operational analytics supporting finance and clinical operations reviews.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-base">Expiry exposure</CardTitle>
            <CardDescription>
              Items requiring disposition within the rolling ninety-day window.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {summary ? summary.expiringSoonCount : "—"}
            </div>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Coordinate pharmacy and materials teams before lots expire.
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-base">Projected revenue coverage</CardTitle>
            <CardDescription>
              Conservative valuation uplift applied for planning scenarios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {summary ? formatInr(summary.revenueEstimate) : "—"}
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-base">Monthly procurement pulse</CardTitle>
            <CardDescription>
              Aggregated PO totals normalized by fiscal months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {summary?.monthlySpend?.length
                ? formatInr(
                    summary.monthlySpend[summary.monthlySpend.length - 1].value,
                  )
                : "—"}
            </div>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Latest recorded spend based on purchase order intake dates.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--border)]">
        <CardHeader>
          <CardTitle>Inventory valuation by category</CardTitle>
          <CardDescription>
            Supports governance conversations around formulary concentration risk.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {mix.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
              Insights populate after catalog assignments stabilize.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mix}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatInr(Number(value))} />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
