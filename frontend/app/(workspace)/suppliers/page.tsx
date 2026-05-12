"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/session";
import { ApiError, suppliersApi } from "@/services/api";
import type { Supplier } from "@/types";

export default function SuppliersPage() {
  const { user } = useSession();
  const canMutate = user?.role === "admin" || user?.role === "manager";

  const [items, setItems] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
  });

  async function reload() {
    const list = await suppliersApi.list();
    setItems(list);
  }

  useEffect(() => {
    void reload().catch(() => toast.error("Unable to load suppliers."));
  }, []);

  async function save() {
    try {
      await suppliersApi.create(form);
      toast.success("Supplier added");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", country: "" });
      await reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Unable to save supplier.");
    }
  }

  async function remove(s: Supplier) {
    if (!window.confirm(`Remove ${s.name}?`)) return;
    try {
      await suppliersApi.remove(s.id);
      toast.success("Supplier removed");
      await reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Unable to remove.");
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Maintain regulated vendor contacts tied to procurement workflows.
          </p>
        </div>
        {canMutate ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add supplier
          </Button>
        ) : null}
      </div>

      <Card className="border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-base">Registry</CardTitle>
          <CardDescription>
            {items.length} suppliers available for purchase orders.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 pr-3 font-medium">Phone</th>
                <th className="py-2 pr-3 font-medium">Country</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--border)]/70 last:border-0"
                >
                  <td className="py-3 pr-3 font-medium">{s.name}</td>
                  <td className="py-3 pr-3 text-[var(--muted-foreground)]">{s.email}</td>
                  <td className="py-3 pr-3">{s.phone}</td>
                  <td className="py-3 pr-3">{s.country}</td>
                  <td className="py-3 text-right">
                    {canMutate ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        type="button"
                        onClick={() => void remove(s)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        View only
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
              Register suppliers to unlock procurement routing.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl outline-none">
            <Dialog.Title className="text-lg font-semibold">New supplier</Dialog.Title>
            <Dialog.Description className="text-sm text-[var(--muted-foreground)]">
              Capture primary contacts—additional compliance records can layer on later.
            </Dialog.Description>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Legal name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="button" onClick={() => void save()}>
                Save supplier
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
