"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Sparkles,
  Truck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSession } from "@/hooks/session";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/procurement", label: "Procurement", icon: ClipboardList },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/analytics", label: "Analytics", icon: Activity },
  { href: "/insights", label: "Smart insights", icon: Sparkles },
];

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-[var(--sidebar-border)] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">
            M
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Medical AI Assistant</div>
            <div className="text-xs text-[var(--muted-foreground)]">
              India · Inventory Cloud
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--muted)] font-medium text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--sidebar-border)] p-4 text-xs text-[var(--muted-foreground)]">
          Signed in as{" "}
          <span className="font-medium text-[var(--foreground)]">
            {user.email}
          </span>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 py-3 backdrop-blur lg:hidden">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <Menu />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40" />
              <Dialog.Content className="fixed left-0 top-0 h-full w-[min(88vw,320px)] border-r border-[var(--border)] bg-[var(--sidebar)] p-4 shadow-xl outline-none">
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold">Navigate</div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="sm">
                      Close
                    </Button>
                  </Dialog.Close>
                </div>
                <div className="flex flex-col gap-1">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Dialog.Close asChild key={item.href}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--muted)]"
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </Link>
                      </Dialog.Close>
                    );
                  })}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <div className="text-sm font-semibold">Medical AI Assistant</div>
          <ThemeToggle />
        </header>

        <header className="hidden items-center justify-between gap-4 border-b border-[var(--border)] px-8 py-4 lg:flex">
          <div className="text-sm text-[var(--muted-foreground)]">
            Operations workspace ·{" "}
            <span className="font-medium text-[var(--foreground)]">
              {nav.find((n) => pathname.startsWith(n.href))?.label ??
                "Overview"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-xs text-[var(--muted-foreground)] xl:block">
              Role:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {user.role}
              </span>
            </div>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
