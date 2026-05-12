import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export type Role = "admin" | "manager" | "viewer";

export interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  stockQuantity: number;
  lowStockThreshold: number;
  unitPrice: number;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  createdAt: string;
}

export type POStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "ordered"
  | "received"
  | "cancelled";

export interface POLineRow {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  productName: string;
}

export interface PurchaseOrderRow {
  id: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  lines: POLineRow[];
  notes: string;
  totalAmount: number;
  expectedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockEventRow {
  at: string;
  productId: string;
  delta: number;
  reason: string;
}

export interface ProductFilter {
  query?: string;
  categoryId?: string;
  lowStock?: boolean;
  expiring?: boolean;
}

function normEmail(e: string) {
  return e.trim().toLowerCase();
}

export class MemoryStore {
  usersById = new Map<string, UserRow>();
  emailToUserId = new Map<string, string>();
  categories = new Map<string, CategoryRow>();
  products = new Map<string, ProductRow>();
  skuLower = new Map<string, string>();
  suppliers = new Map<string, SupplierRow>();
  purchaseOrders = new Map<string, PurchaseOrderRow>();
  stockEvents: StockEventRow[] = [];

  seed() {
    if (this.usersById.size > 0) return;

    const adminHash = bcrypt.hashSync("SwasthyaIndia2026!", 10);
    const adminId = randomUUID();
    const admin: UserRow = {
      id: adminId,
      email: "admin@swasthya-ai.in",
      passwordHash: adminHash,
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    this.usersById.set(adminId, admin);
    this.emailToUserId.set(normEmail(admin.email), adminId);

    const catPharma = this.addCategory(
      "Pharmaceuticals",
      "Rx and OTC medicines",
    );
    const catSurgical = this.addCategory(
      "Surgical Supplies",
      "Instruments and drapes",
    );
    const catDiag = this.addCategory(
      "Diagnostics",
      "Reagents and rapid tests",
    );

    const supA = this.addSupplier({
      name: "Apollo Surgicals India Pvt Ltd",
      email: "procurement@apollo-surgicals.in",
      phone: "+91-22-67432100",
      country: "India",
    });
    this.addSupplier({
      name: "Redcliffe Lifesciences India",
      email: "supply@redcliffe.in",
      phone: "+91-124-44556677",
      country: "India",
    });

    const expSoon = new Date();
    expSoon.setUTCDate(expSoon.getUTCDate() + 45);
    const expLater = new Date();
    expLater.setUTCMonth(expLater.getUTCMonth() + 6);

    const p1 = this.createProductInternal({
      name: "Amoxicillin 500mg",
      sku: "RX-AMX-500",
      categoryId: catPharma.id,
      stockQuantity: 120,
      lowStockThreshold: 80,
      unitPrice: 1480,
      expiryDate: expLater.toISOString(),
    });
    const p2 = this.createProductInternal({
      name: "Sterile Gauze 4x4",
      sku: "SU-GAU-44",
      categoryId: catSurgical.id,
      stockQuantity: 40,
      lowStockThreshold: 100,
      unitPrice: 520,
      expiryDate: null,
    });
    this.createProductInternal({
      name: "HbA1c Reagent Kit",
      sku: "DX-HBA1C-01",
      categoryId: catDiag.id,
      stockQuantity: 55,
      lowStockThreshold: 30,
      unitPrice: 18200,
      expiryDate: expSoon.toISOString(),
    });

    this.appendStock(p1.id, 40, "seed");
    this.appendStock(p1.id, -12, "consumption");
    this.appendStock(p2.id, -60, "consumption");

    const expected = new Date();
    expected.setUTCDate(expected.getUTCDate() + 14);
    const poId = randomUUID();
    const po: PurchaseOrderRow = {
      id: poId,
      supplierId: supA.id,
      supplierName: supA.name,
      status: "ordered",
      lines: [
        {
          id: randomUUID(),
          productId: p2.id,
          quantity: 200,
          unitCost: 385,
          productName: p2.name,
        },
      ],
      notes: "Restock gauze – Bengaluru warehouse",
      totalAmount: 200 * 385,
      expectedDate: expected.toISOString(),
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.purchaseOrders.set(poId, po);
  }

  private addCategory(name: string, description: string): CategoryRow {
    const c: CategoryRow = {
      id: randomUUID(),
      name,
      description,
      createdAt: new Date().toISOString(),
    };
    this.categories.set(c.id, c);
    return c;
  }

  private addSupplier(p: Omit<SupplierRow, "id" | "createdAt">): SupplierRow {
    const s: SupplierRow = {
      id: randomUUID(),
      ...p,
      createdAt: new Date().toISOString(),
    };
    this.suppliers.set(s.id, s);
    return s;
  }

  private createProductInternal(p: {
    name: string;
    sku: string;
    categoryId: string;
    stockQuantity: number;
    lowStockThreshold: number;
    unitPrice: number;
    expiryDate: string | null;
  }): ProductRow {
    const now = new Date().toISOString();
    const row: ProductRow = {
      id: randomUUID(),
      name: p.name,
      sku: p.sku,
      categoryId: p.categoryId,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      unitPrice: p.unitPrice,
      expiryDate: p.expiryDate,
      createdAt: now,
      updatedAt: now,
    };
    this.products.set(row.id, row);
    this.skuLower.set(row.sku.trim().toLowerCase(), row.id);
    return row;
  }

  register(email: string, password: string, role: Role) {
    const em = normEmail(email);
    if (this.emailToUserId.has(em)) {
      throw new Error("email already registered");
    }
    if (role !== "viewer" && role !== "manager") {
      role = "viewer";
    }
    const id = randomUUID();
    const u: UserRow = {
      id,
      email: em,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      createdAt: new Date().toISOString(),
    };
    this.usersById.set(id, u);
    this.emailToUserId.set(em, id);
    return u;
  }

  login(email: string, password: string): UserRow | null {
    const em = normEmail(email);
    const id = this.emailToUserId.get(em);
    if (!id) return null;
    const u = this.usersById.get(id);
    if (!u || !bcrypt.compareSync(password, u.passwordHash)) return null;
    return u;
  }

  getUser(id: string): UserRow | undefined {
    return this.usersById.get(id);
  }

  getProduct(id: string): ProductRow | undefined {
    return this.products.get(id);
  }

  getPurchaseOrder(id: string): PurchaseOrderRow | undefined {
    return this.purchaseOrders.get(id);
  }

  appendStock(productId: string, delta: number, reason: string) {
    this.stockEvents.push({
      at: new Date().toISOString(),
      productId,
      delta,
      reason,
    });
    if (this.stockEvents.length > 5000) {
      this.stockEvents = this.stockEvents.slice(-5000);
    }
  }

  listStockEvents(productId: string, limit: number): StockEventRow[] {
    const m: StockEventRow[] = [];
    for (let i = this.stockEvents.length - 1; i >= 0; i--) {
      const e = this.stockEvents[i];
      if (e.productId === productId) {
        m.push(e);
        if (limit > 0 && m.length >= limit) break;
      }
    }
    return m.reverse();
  }

  matchesFilter(p: ProductRow, f: ProductFilter): boolean {
    if (f.categoryId && p.categoryId !== f.categoryId) return false;
    if (f.query) {
      const q = f.query.toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.sku.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (f.lowStock && p.stockQuantity > p.lowStockThreshold) return false;
    if (f.expiring) {
      if (!p.expiryDate) return false;
      const exp = new Date(p.expiryDate);
      const now = new Date();
      const days = (exp.getTime() - now.getTime()) / 86400000;
      if (days > 90 || days < 0) return false;
    }
    return true;
  }

  listProducts(f: ProductFilter): ProductRow[] {
    return [...this.products.values()]
      .filter((p) => this.matchesFilter(p, f))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  createProduct(body: {
    name: string;
    sku: string;
    categoryId: string;
    stockQuantity: number;
    lowStockThreshold: number;
    unitPrice: number;
    expiryDate: string | null | undefined;
  }) {
    const skuKey = body.sku.trim().toLowerCase();
    if (this.skuLower.has(skuKey)) {
      throw new Error("sku already exists");
    }
    const now = new Date().toISOString();
    const row: ProductRow = {
      id: randomUUID(),
      name: body.name.trim(),
      sku: body.sku.trim(),
      categoryId: body.categoryId,
      stockQuantity: body.stockQuantity,
      lowStockThreshold: body.lowStockThreshold,
      unitPrice: body.unitPrice,
      expiryDate: body.expiryDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.products.set(row.id, row);
    this.skuLower.set(skuKey, row.id);
    this.appendStock(row.id, row.stockQuantity, "initial stock");
    return row;
  }

  updateProduct(
    id: string,
    body: {
      name: string;
      sku: string;
      categoryId: string;
      stockQuantity: number;
      lowStockThreshold: number;
      unitPrice: number;
      expiryDate: string | null | undefined;
    },
  ) {
    const prev = this.products.get(id);
    if (!prev) throw new Error("not found");
    const skuKey = body.sku.trim().toLowerCase();
    const existingId = this.skuLower.get(skuKey);
    if (existingId && existingId !== id) {
      throw new Error("sku already exists");
    }
    if (prev.sku.trim().toLowerCase() !== skuKey) {
      this.skuLower.delete(prev.sku.trim().toLowerCase());
      this.skuLower.set(skuKey, id);
    }
    const delta = body.stockQuantity - prev.stockQuantity;
    const row: ProductRow = {
      ...prev,
      name: body.name.trim(),
      sku: body.sku.trim(),
      categoryId: body.categoryId,
      stockQuantity: body.stockQuantity,
      lowStockThreshold: body.lowStockThreshold,
      unitPrice: body.unitPrice,
      expiryDate: body.expiryDate ?? null,
      updatedAt: new Date().toISOString(),
    };
    this.products.set(id, row);
    if (delta !== 0) {
      this.appendStock(id, delta, delta > 0 ? "restock" : "adjustment");
    }
    return row;
  }

  deleteProduct(id: string) {
    const p = this.products.get(id);
    if (!p) throw new Error("not found");
    this.products.delete(id);
    this.skuLower.delete(p.sku.trim().toLowerCase());
  }

  listCategories(): CategoryRow[] {
    return [...this.categories.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  createCategory(name: string, description: string) {
    const c: CategoryRow = {
      id: randomUUID(),
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };
    this.categories.set(c.id, c);
    return c;
  }

  updateCategory(id: string, name: string, description: string) {
    const c = this.categories.get(id);
    if (!c) throw new Error("not found");
    const u: CategoryRow = {
      ...c,
      name: name.trim(),
      description: description.trim(),
    };
    this.categories.set(id, u);
    return u;
  }

  deleteCategory(id: string) {
    if (!this.categories.has(id)) throw new Error("not found");
    this.categories.delete(id);
  }

  listSuppliers(): SupplierRow[] {
    return [...this.suppliers.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  createSupplier(body: {
    name: string;
    email: string;
    phone: string;
    country: string;
  }) {
    const s: SupplierRow = {
      id: randomUUID(),
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      country: body.country.trim(),
      createdAt: new Date().toISOString(),
    };
    this.suppliers.set(s.id, s);
    return s;
  }

  updateSupplier(
    id: string,
    body: { name: string; email: string; phone: string; country: string },
  ) {
    const s = this.suppliers.get(id);
    if (!s) throw new Error("not found");
    const u: SupplierRow = {
      ...s,
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      country: body.country.trim(),
    };
    this.suppliers.set(id, u);
    return u;
  }

  deleteSupplier(id: string) {
    if (!this.suppliers.has(id)) throw new Error("not found");
    this.suppliers.delete(id);
  }

  listPurchaseOrders(): PurchaseOrderRow[] {
    return [...this.purchaseOrders.values()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  createPurchaseOrder(input: {
    supplierId: string;
    status: POStatus;
    notes: string;
    lines: { productId: string; quantity: number; unitCost: number }[];
    expectedDate: string | null | undefined;
  }) {
    const sup = this.suppliers.get(input.supplierId);
    if (!sup) throw new Error("supplier not found");
    const lines: POLineRow[] = [];
    let total = 0;
    for (const ln of input.lines) {
      const pr = this.products.get(ln.productId);
      const line: POLineRow = {
        id: randomUUID(),
        productId: ln.productId,
        quantity: ln.quantity,
        unitCost: ln.unitCost,
        productName: pr?.name ?? "",
      };
      lines.push(line);
      total += ln.quantity * ln.unitCost;
    }
    const now = new Date().toISOString();
    const po: PurchaseOrderRow = {
      id: randomUUID(),
      supplierId: sup.id,
      supplierName: sup.name,
      status: input.status || "draft",
      lines,
      notes: input.notes.trim(),
      totalAmount: total,
      expectedDate: input.expectedDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.purchaseOrders.set(po.id, po);
    return po;
  }

  updatePurchaseOrder(
    id: string,
    input: {
      supplierId: string;
      status: POStatus;
      notes: string;
      lines: {
        id?: string;
        productId: string;
        quantity: number;
        unitCost: number;
      }[];
      expectedDate: string | null | undefined;
    },
  ) {
    const prev = this.purchaseOrders.get(id);
    if (!prev) throw new Error("not found");
    const sup = this.suppliers.get(input.supplierId);
    if (!sup) throw new Error("supplier not found");
    const lines: POLineRow[] = [];
    let total = 0;
    for (const ln of input.lines) {
      const pr = this.products.get(ln.productId);
      const line: POLineRow = {
        id: ln.id && ln.id.length > 0 ? ln.id : randomUUID(),
        productId: ln.productId,
        quantity: ln.quantity,
        unitCost: ln.unitCost,
        productName: pr?.name ?? "",
      };
      lines.push(line);
      total += ln.quantity * ln.unitCost;
    }
    const po: PurchaseOrderRow = {
      ...prev,
      supplierId: sup.id,
      supplierName: sup.name,
      status: input.status,
      notes: input.notes.trim(),
      lines,
      totalAmount: total,
      expectedDate: input.expectedDate ?? null,
      updatedAt: new Date().toISOString(),
    };
    this.purchaseOrders.set(id, po);
    return po;
  }

  deletePurchaseOrder(id: string) {
    if (!this.purchaseOrders.has(id)) throw new Error("not found");
    this.purchaseOrders.delete(id);
  }
}

const g = globalThis as unknown as { __maiMemStoreIn?: MemoryStore };

export function getStore(): MemoryStore {
  if (!g.__maiMemStoreIn) {
    g.__maiMemStoreIn = new MemoryStore();
    g.__maiMemStoreIn.seed();
  }
  return g.__maiMemStoreIn;
}
