import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(14,165,233,0.12),_transparent_50%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-16 lg:py-24">
        <div className="flex-1 animate-fade-in space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] shadow-[var(--shadow-sm)]">
            Healthcare inventory intelligence
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-[var(--foreground)] lg:text-5xl">
            Medical AI Assistant for inventory you can trust.
          </h1>
          <p className="max-w-xl text-pretty text-lg text-[var(--muted-foreground)]">
            Monitor stock, orchestrate procurement, and surface actionable insights
            across categories, suppliers, and purchase orders—built for hospital and
            clinic supply teams in India who need clarity without complexity.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </div>
        <div className="flex-1 animate-fade-in">
          <Card className="border-[var(--border)] bg-[var(--card)]/90 backdrop-blur">
            <CardHeader>
              <CardTitle>Operational snapshot</CardTitle>
              <CardDescription>
                Live dashboards, expiry analytics, and procurement tracking out of the
                box.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/60 p-4">
                <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                  Designed for scale
                </div>
                <div className="mt-2 text-sm text-[var(--foreground)]">
                  JWT auth, rupee-based valuation, fine-grained roles, REST APIs, and
                  container-ready packaging.
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/60 p-4">
                <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                  Procurement clarity
                </div>
                <div className="mt-2 text-sm text-[var(--foreground)]">
                  Supplier registry, PO lifecycle, and spend analytics aligned with how
                  hospitals actually operate.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
