"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/session";
import { ApiError } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, user } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Unable to sign in right now.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <Card className="w-full max-w-md border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to manage inventory, procurement, and analytics.             Demo admin:
            admin@swasthya-ai.in · SwasthyaIndia2026!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Continue"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
            Need an account?{" "}
            <Link className="font-medium text-[var(--primary)]" href="/signup">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
