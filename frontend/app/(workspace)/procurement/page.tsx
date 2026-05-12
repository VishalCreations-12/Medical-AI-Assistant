"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { formatInr } from "@/lib/format";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/session";
import {
  ApiError,
  productsApi,
  purchaseOrdersApi,
  suppliersApi,
} from "@/services/api";
import type { Product, PurchaseOrder, PurchaseOrderStatus, Supplier } from "@/types";

const statuses: PurchaseOrderStatus[] = [
  "draft",
  "submitted",
  "approved",
  "ordered",
  "received",
  "cancelled",
];

export default function ProcurementPage() {
  const { user } = useSession();
  const canMutate = user?.role === "admin" || user?.role === "manager";

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    supplierId: "",
    status: "draft" as PurchaseOrderStatus,
    notes: "",
    productId: "",
    quantity: 1,
    unitCost: 0,
  });

  const reload = useCallback(async () => {
    const [pos, sups, prods] = await Promise.all([
      purchaseOrdersApi.list(),
      suppliersApi.list(),
      productsApi.list(),
    ]);
    setOrders(pos);
    setSuppliers(sups);
    setProducts(prods);
    setForm((f) => {
      let next = f;
      if (!f.supplierId && sups[0]) {
        next = { ...next, supplierId: sups[0].id };
      }
      if (!f.productId && prods[0]) {
        next = { ...next, productId: prods[0].id };
      }
      return next;
    });
  }, []);

  useEffect(() => {
    void reload().catch(() => toast.error("Unable to load procurement data."));
  }, [reload]);

  const supplierName = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of suppliers) {
      m.set(s.id, s.name);
    }
    return m;
  }, [suppliers]);

  async function createOrder() {
    try {
      await purchaseOrdersApi.create({
        supplierId: form.supplierId,
        status: form.status,
        notes: form.notes,
        lines: [
          {
            productId: form.productId,
            quantity: Number(form.quantity),
            unitCost: Number(form.unitCost),
          },
        ],
      });
      toast.success("Purchase order created");
      setOpen(false);
      await reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Unable to create order.");
    }
  }

  async function advance(po: PurchaseOrder, status: PurchaseOrderStatus) {
    try {
      await purchaseOrdersApi.update(po.id, {
        supplierId: po.supplierId,
        status,
        notes: po.notes,
        lines: po.lines.map((l) => ({
          id: l.id,
          productId: l.productId,
          quantity: l.quantity,
          unitCost: l.unitCost,
        })),
        expectedDate: po.expectedDate,
      });
      toast.success("Order updated");
      await reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Unable to update.");
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Procurement</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Track supplier commitments from draft through receipt.
          </p>
        </div>
        {canMutate ? (
          <Button
            onClick={() => {
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            New purchase order
          </Button>
        ) : null}
      </div>

      <Card className="border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-base">Purchase orders</CardTitle>
          <CardDescription>
            Most recent procurement activity across connected suppliers.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="py-2 pr-3 font-medium">Identifier</th>
                <th className="py-2 pr-3 font-medium">Supplier</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Total</th>
                <th className="py-2 pr-3 font-medium">Lines</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr
                  key={po.id}
                  className="border-b border-[var(--border)]/70 last:border-0"
                >
                  <td className="py-3 pr-3 font-mono text-xs">{po.id.slice(0, 8)}…</td>
                  <td className="py-3 pr-3">
                    {po.supplierName ?? supplierName.get(po.supplierId) ?? "—"}
                  </td>
                  <td className="py-3 pr-3">
                    <Badge variant="secondary">{po.status}</Badge>
                  </td>
                  <td className="py-3 pr-3">
                    {formatInr(po.totalAmount)}
                  </td>
                  <td className="py-3 pr-3">{po.lines.length}</td>
                  <td className="py-3 text-right">
                    {canMutate ? (
                      <div className="flex justify-end gap-2">
                        {po.status === "draft" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => void advance(po, "submitted")}
                          >
                            Submit
                          </Button>
                        ) : null}
                        {po.status === "submitted" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => void advance(po, "approved")}
                          >
                            Approve
                          </Button>
                        ) : null}
                        {po.status === "approved" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => void advance(po, "ordered")}
                          >
                            Mark ordered
                          </Button>
                        ) : null}
                        {po.status === "ordered" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => void advance(po, "received")}
                          >
                            Receive
                          </Button>
                        ) : null}
                      </div>
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
          {orders.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
              No purchase orders yet—create one to orchestrate inbound supply.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl outline-none">
            <Dialog.Title className="text-lg font-semibold">
              Create purchase order
            </Dialog.Title>
            <Dialog.Description className="text-sm text-[var(--muted-foreground)]">
              Start with a single line—expand lines from inventory workflows as your team
              scales.
            </Dialog.Description>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="supplier">Supplier</Label>
                <select
                  id="supplier"
                  className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  value={form.supplierId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplierId: e.target.value }))
                  }
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as PurchaseOrderStatus,
                    }))
                  }
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product">Product line</Label>
                <select
                  id="product"
                  className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  value={form.productId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, productId: e.target.value }))
                  }
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cost">Unit cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={form.unitCost}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unitCost: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="button" onClick={() => void createOrder()}>
                Create
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
