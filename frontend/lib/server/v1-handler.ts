import type { Role } from "@/lib/server/memory-store";
import { getStore } from "@/lib/server/memory-store";
import { signToken, verifyToken } from "@/lib/server/jwt";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function err(message: string, status: number) {
  return json({ error: message }, status);
}

async function readJson<T>(req: Request): Promise<T> {
  return req.json() as Promise<T>;
}

function bearerUid(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!h.startsWith(prefix)) return null;
  return h.slice(prefix.length).trim();
}

async function authUser(req: Request) {
  const raw = bearerUid(req);
  if (!raw) return null;
  try {
    const claims = await verifyToken(raw);
    if (!claims) return null;
    const store = getStore();
    const user = store.getUser(claims.uid);
    if (!user) return null;
    return { user, role: claims.role as Role };
  } catch {
    return null;
  }
}

function publicUser(u: { id: string; email: string; role: Role; createdAt: string }) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  };
}

function canMutate(role: string) {
  return role === "admin" || role === "manager";
}

function dashboardSummary() {
  const store = getStore();
  const prods = store.listProducts({});
  const cats = store.listCategories();
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const orders = store.listPurchaseOrders();

  let inventoryValue = 0;
  let low = 0;
  let expSoon = 0;
  const now = new Date();
  for (const p of prods) {
    inventoryValue += p.stockQuantity * p.unitPrice;
    if (p.stockQuantity <= p.lowStockThreshold) low++;
    if (p.expiryDate) {
      const exp = new Date(p.expiryDate);
      const ms = exp.getTime() - now.getTime();
      const days = ms / 86400000;
      if (days <= 90 && days > 0) expSoon++;
    }
  }

  let open = 0;
  const spendByMonth: Record<string, number> = {};
  for (const o of orders) {
    if (o.status !== "received" && o.status !== "cancelled") open++;
    const key = o.createdAt.slice(0, 7);
    spendByMonth[key] = (spendByMonth[key] ?? 0) + o.totalAmount;
  }
  const months = Object.keys(spendByMonth).sort();
  let monthlySpend = months.map((m) => ({
    month: m,
    value: spendByMonth[m],
  }));
  if (monthlySpend.length > 12) {
    monthlySpend = monthlySpend.slice(-12);
  }

  const mixMap: Record<string, number> = {};
  for (const p of prods) {
    const name = catName.get(p.categoryId) ?? "Uncategorized";
    mixMap[name] = (mixMap[name] ?? 0) + p.stockQuantity * p.unitPrice;
  }
  const categoryMix = Object.entries(mixMap)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);

  let revenueEstimate = 0;
  for (const p of prods) {
    revenueEstimate += p.stockQuantity * p.unitPrice * 1.12;
  }

  return {
    inventoryValue,
    skuCount: prods.length,
    lowStockCount: low,
    expiringSoonCount: expSoon,
    openOrders: open,
    monthlySpend,
    categoryMix,
    revenueEstimate,
  };
}

function insightsBundle() {
  const store = getStore();
  const prods = store.listProducts({});
  const cats = store.listCategories();
  const catName = new Map(cats.map((c) => [c.id, c.name]));

  type Rec = {
    productId: string;
    name: string;
    sku: string;
    suggestedQty: number;
    reason: string;
    urgency: string;
    estimatedCost: number;
  };
  const recommendations: Rec[] = [];
  const lowStockPredictions: {
    productId: string;
    name: string;
    daysUntilStockout: number;
    confidence: string;
  }[] = [];

  for (const p of prods) {
    let suggested = p.lowStockThreshold * 2 - p.stockQuantity;
    if (suggested < p.lowStockThreshold) {
      suggested = p.lowStockThreshold;
    }
    if (p.stockQuantity <= p.lowStockThreshold) {
      let urgency = "medium";
      let reason = "Stock at or below reorder threshold";
      if (p.stockQuantity <= p.lowStockThreshold / 2) {
        urgency = "high";
        reason = "Critical stock level relative to policy";
      }
      recommendations.push({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        suggestedQty: suggested,
        reason,
        urgency,
        estimatedCost: suggested * p.unitPrice,
      });
      const daily = p.stockQuantity > 30 ? 3 : 1;
      let days = Math.floor(p.stockQuantity / daily);
      if (days < 0) days = 0;
      const cn = catName.get(p.categoryId) ?? "";
      const confidence =
        cn.toLowerCase().includes("pharma") ? "high" : "medium";
      lowStockPredictions.push({
        productId: p.id,
        name: p.name,
        daysUntilStockout: days,
        confidence,
      });
    }
  }

  const rank: Record<string, number> = { high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => {
    const ri = rank[a.urgency] ?? 0;
    const rj = rank[b.urgency] ?? 0;
    if (ri !== rj) return rj - ri;
    return b.estimatedCost - a.estimatedCost;
  });

  const deltaByMonth: Record<string, number> = {};
  for (const p of prods) {
    const events = store.listStockEvents(p.id, 80);
    for (const e of events) {
      const t = new Date(e.at);
      if (Number.isNaN(t.getTime())) continue;
      const key = t.toISOString().slice(0, 7);
      deltaByMonth[key] = (deltaByMonth[key] ?? 0) + e.delta;
    }
  }
  const mk = Object.keys(deltaByMonth).sort();
  let trends = mk.map((month) => ({
    month,
    netChange: deltaByMonth[month],
  }));
  if (trends.length > 18) {
    trends = trends.slice(-18);
  }

  return { recommendations, lowStockPredictions, trends };
}

export async function dispatchV1(
  method: string,
  segments: string[],
  req: Request,
): Promise<Response> {
  const store = getStore();
  const path = segments.join("/");

  try {
    if (path === "auth/register" && method === "POST") {
      const body = await readJson<{
        email: string;
        password: string;
        role?: string;
      }>(req);
      let role = (body.role as Role) ?? "viewer";
      if (role !== "viewer" && role !== "manager") role = "viewer";
      try {
        const u = store.register(body.email, body.password, role);
        const token = await signToken(u.id, u.role);
        return json({ token, user: publicUser(u) }, 201);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "conflict";
        if (msg.includes("already")) return err(msg, 409);
        throw e;
      }
    }

    if (path === "auth/login" && method === "POST") {
      const body = await readJson<{ email: string; password: string }>(req);
      const u = store.login(body.email, body.password);
      if (!u) return err("invalid credentials", 401);
      const token = await signToken(u.id, u.role);
      return json({ token, user: publicUser(u) });
    }

    if (path === "auth/logout" && method === "POST") {
      return json({ ok: true });
    }

    if (path === "auth/me" && method === "GET") {
      const me = await authUser(req);
      if (!me) return err("missing bearer token", 401);
      return json(publicUser(me.user));
    }

    const session = await authUser(req);
    if (!session) {
      return err("missing bearer token", 401);
    }
    const a = session;

    if (path === "dashboard/summary" && method === "GET") {
      return json(dashboardSummary());
    }

    if (path === "insights" && method === "GET") {
      return json(insightsBundle());
    }

    if (path === "products" && method === "GET") {
      const url = new URL(req.url);
      const q = url.searchParams.get("q") ?? "";
      const categoryId = url.searchParams.get("categoryId") ?? "";
      const ls = url.searchParams.get("lowStock");
      const ex = url.searchParams.get("expiring");
      const list = store.listProducts({
        query: q || undefined,
        categoryId: categoryId || undefined,
        lowStock: ls === "true" || ls === "1" ? true : undefined,
        expiring: ex === "true" || ex === "1" ? true : undefined,
      });
      return json(list);
    }

    if (path === "products" && method === "POST") {
      if (!canMutate(a!.user.role)) return err("insufficient role", 403);
      const body = await readJson<Record<string, unknown>>(req);
      const row = store.createProduct({
        name: String(body.name ?? ""),
        sku: String(body.sku ?? ""),
        categoryId: String(body.categoryId ?? ""),
        stockQuantity: Number(body.stockQuantity ?? 0),
        lowStockThreshold: Number(body.lowStockThreshold ?? 0),
        unitPrice: Number(body.unitPrice ?? 0),
        expiryDate:
          typeof body.expiryDate === "string" ? body.expiryDate : null,
      });
      return json(row, 201);
    }

    if (
      segments[0] === "products" &&
      segments.length === 2 &&
      segments[1]
    ) {
      const id = segments[1];
      if (method === "GET") {
        const p = store.getProduct(id);
        if (!p) return err("not found", 404);
        return json(p);
      }
      if (method === "PUT") {
        if (!canMutate(a!.user.role)) return err("insufficient role", 403);
        const body = await readJson<Record<string, unknown>>(req);
        try {
          const row = store.updateProduct(id, {
            name: String(body.name ?? ""),
            sku: String(body.sku ?? ""),
            categoryId: String(body.categoryId ?? ""),
            stockQuantity: Number(body.stockQuantity ?? 0),
            lowStockThreshold: Number(body.lowStockThreshold ?? 0),
            unitPrice: Number(body.unitPrice ?? 0),
            expiryDate:
              typeof body.expiryDate === "string" ? body.expiryDate : null,
          });
          return json(row);
        } catch {
          return err("not found", 404);
        }
      }
      if (method === "DELETE") {
        if (!canMutate(a!.user.role)) return err("insufficient role", 403);
        try {
          store.deleteProduct(id);
          return json({ ok: true });
        } catch {
          return err("not found", 404);
        }
      }
    }

    if (path === "categories" && method === "GET") {
      return json(store.listCategories());
    }

    if (path === "categories" && method === "POST") {
      if (!canMutate(a!.user.role)) return err("insufficient role", 403);
      const body = await readJson<{ name: string; description?: string }>(req);
      const c = store.createCategory(body.name, body.description ?? "");
      return json(c, 201);
    }

    if (
      segments[0] === "categories" &&
      segments.length === 2 &&
      segments[1]
    ) {
      const id = segments[1];
      if (method === "PUT") {
        if (!canMutate(a!.user.role)) return err("insufficient role", 403);
        const body = await readJson<{ name: string; description?: string }>(
          req,
        );
        try {
          return json(store.updateCategory(id, body.name, body.description ?? ""));
        } catch {
          return err("not found", 404);
        }
      }
      if (method === "DELETE") {
        if (!canMutate(a!.user.role)) return err("insufficient role", 403);
        try {
          store.deleteCategory(id);
          return json({ ok: true });
        } catch {
          return err("not found", 404);
        }
      }
    }

    if (path === "suppliers" && method === "GET") {
      return json(store.listSuppliers());
    }

    if (path === "suppliers" && method === "POST") {
      if (!canMutate(a!.user.role)) return err("insufficient role", 403);
      const body = await readJson<{
        name: string;
        email: string;
        phone: string;
        country: string;
      }>(req);
      const s = store.createSupplier(body);
      return json(s, 201);
    }

    if (
      segments[0] === "suppliers" &&
      segments.length === 2 &&
      segments[1]
    ) {
      const id = segments[1];
      if (method === "PUT") {
        if (!canMutate(a!.user.role)) return err("insufficient role", 403);
        const body = await readJson<{
          name: string;
          email: string;
          phone: string;
          country: string;
        }>(req);
        try {
          return json(store.updateSupplier(id, body));
        } catch {
          return err("not found", 404);
        }
      }
      if (method === "DELETE") {
        if (!canMutate(a!.user.role)) return err("insufficient role", 403);
        try {
          store.deleteSupplier(id);
          return json({ ok: true });
        } catch {
          return err("not found", 404);
        }
      }
    }

    if (path === "purchase-orders" && method === "GET") {
      return json(store.listPurchaseOrders());
    }

    if (path === "purchase-orders" && method === "POST") {
      if (!canMutate(a!.user.role)) return err("insufficient role", 403);
      const body = await readJson<{
        supplierId: string;
        status?: string;
        notes?: string;
        lines: { productId: string; quantity: number; unitCost: number }[];
        expectedDate?: string | null;
      }>(req);
      try {
        const po = store.createPurchaseOrder({
          supplierId: body.supplierId,
          status: (body.status as never) ?? "draft",
          notes: body.notes ?? "",
          lines: body.lines ?? [],
          expectedDate: body.expectedDate,
        });
        return json(po, 201);
      } catch {
        return err("supplier not found", 400);
      }
    }

    if (
      segments[0] === "purchase-orders" &&
      segments.length === 2 &&
      segments[1]
    ) {
      const id = segments[1];
      if (method === "GET") {
        const po = store.getPurchaseOrder(id);
        if (!po) return err("not found", 404);
        return json(po);
      }
      if (method === "PUT") {
        if (!canMutate(a!.user.role)) return err("insufficient role", 403);
        const body = await readJson<{
          supplierId: string;
          status: string;
          notes?: string;
          lines: {
            id?: string;
            productId: string;
            quantity: number;
            unitCost: number;
          }[];
          expectedDate?: string | null;
        }>(req);
        try {
          return json(
            store.updatePurchaseOrder(id, {
              supplierId: body.supplierId,
              status: body.status as never,
              notes: body.notes ?? "",
              lines: body.lines ?? [],
              expectedDate: body.expectedDate,
            }),
          );
        } catch {
          return err("not found", 400);
        }
      }
      if (method === "DELETE") {
        if (!canMutate(a!.user.role)) return err("insufficient role", 403);
        try {
          store.deletePurchaseOrder(id);
          return json({ ok: true });
        } catch {
          return err("not found", 404);
        }
      }
    }

    return err("not found", 404);
  } catch (e) {
    console.error(e);
    return err("internal server error", 500);
  }
}
