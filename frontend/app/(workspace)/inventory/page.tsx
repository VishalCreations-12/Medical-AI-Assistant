"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Filter, Pencil, Plus, Trash2 } from "lucide-react";
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
  categoriesApi,
  productsApi,
} from "@/services/api";
import type { Category, Product } from "@/types";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function InventoryPage() {
  const { user } = useSession();
  const canMutate = user?.role === "admin" || user?.role === "manager";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    stockQuantity: 0,
    lowStockThreshold: 0,
    unitPrice: 0,
    expiryDate: "",
  });

  const reload = useCallback(async () => {
    const list = await productsApi.list({
      q: query || undefined,
      categoryId: categoryId || undefined,
      lowStock: lowOnly || undefined,
      expiring: expiringOnly || undefined,
    });
    setProducts(list);
  }, [query, categoryId, lowOnly, expiringOnly]);

  useEffect(() => {
    void (async () => {
      try {
        const cats = await categoriesApi.list();
        setCategories(cats);
      } catch {
        toast.error("Unable to load categories.");
      }
    })();
  }, []);

  useEffect(() => {
    void reload().catch(() => toast.error("Unable to load inventory."));
  }, [reload]);

  const categoryName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.id, c.name);
    }
    return map;
  }, [categories]);

  function resetForm() {
    const defaultCat = categories[0]?.id ?? "";
    setForm({
      name: "",
      sku: "",
      categoryId: defaultCat,
      stockQuantity: 0,
      lowStockThreshold: 10,
      unitPrice: 0,
      expiryDate: "",
    });
    setEditing(null);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      categoryId: p.categoryId,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      unitPrice: p.unitPrice,
      expiryDate: p.expiryDate ? p.expiryDate.slice(0, 10) : "",
    });
    setOpen(true);
  }

  async function saveProduct() {
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        categoryId: form.categoryId,
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
        unitPrice: Number(form.unitPrice),
        expiryDate: form.expiryDate ? `${form.expiryDate}T00:00:00Z` : null,
      };
      if (editing) {
        await productsApi.update(editing.id, payload);
        toast.success("Product updated");
      } else {
        await productsApi.create(payload);
        toast.success("Product added");
      }
      setOpen(false);
      await reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save product.");
    }
  }

  async function removeProduct(p: Product) {
    if (!window.confirm(`Remove ${p.name}?`)) return;
    try {
      await productsApi.remove(p.id);
      toast.success("Product removed");
      await reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not remove.");
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Search and filter catalog stock with expiry and replenishment context.
          </p>
        </div>
        {canMutate ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add product
          </Button>
        ) : null}
      </div>

      <Card className="border-[var(--border)]">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>
              Combine text search with supply risk lenses.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={lowOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setLowOnly((v) => !v)}
            >
              Low stock
            </Button>
            <Button
              type="button"
              variant={expiringOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setExpiringOnly((v) => !v)}
            >
              Expiring ≤90d
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              placeholder="Name or SKU"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 md:col-span-1">
            <Button type="button" variant="outline" onClick={() => void reload()}>
              <Filter className="size-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-base">Catalog</CardTitle>
          <CardDescription>{products.length} products match this view.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="py-2 pr-3 font-medium">Product</th>
                <th className="py-2 pr-3 font-medium">SKU</th>
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 pr-3 font-medium">Stock</th>
                <th className="py-2 pr-3 font-medium">Threshold</th>
                <th className="py-2 pr-3 font-medium">Expiry</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = p.stockQuantity <= p.lowStockThreshold;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--border)]/70 last:border-0"
                  >
                    <td className="py-3 pr-3 font-medium">{p.name}</td>
                    <td className="py-3 pr-3 text-[var(--muted-foreground)]">{p.sku}</td>
                    <td className="py-3 pr-3">
                      {categoryName.get(p.categoryId) ?? "—"}
                    </td>
                    <td className="py-3 pr-3">{p.stockQuantity}</td>
                    <td className="py-3 pr-3">{p.lowStockThreshold}</td>
                    <td className="py-3 pr-3">{formatDate(p.expiryDate)}</td>
                    <td className="py-3 pr-3">
                      {low ? (
                        <Badge variant="warning">Low stock</Badge>
                      ) : (
                        <Badge variant="success">Healthy</Badge>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {canMutate ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            type="button"
                            onClick={() => void removeProduct(p)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          View only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
              No products match these filters yet.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog.Root
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl outline-none">
            <Dialog.Title className="text-lg font-semibold">
              {editing ? "Edit product" : "New product"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-[var(--muted-foreground)]">
              Provide catalog identifiers and replenishment guardrails.
            </Dialog.Description>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat">Category</Label>
                <select
                  id="cat"
                  className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        stockQuantity: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="thresh">Reorder threshold</Label>
                  <Input
                    id="thresh"
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        lowStockThreshold: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Unit price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="exp">Expiry (optional)</Label>
                <Input
                  id="exp"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expiryDate: e.target.value }))
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
              <Button type="button" onClick={() => void saveProduct()}>
                Save
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
