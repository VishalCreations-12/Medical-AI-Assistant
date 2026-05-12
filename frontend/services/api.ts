import { getApiOrigin } from "@/lib/api-origin";
import type {
  Category,
  DashboardSummary,
  InsightsBundle,
  Product,
  PurchaseOrder,
  Supplier,
  User,
} from "@/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function resolveToken(explicit?: string | null): string | null {
  if (explicit !== undefined) {
    return explicit;
  }
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("mai_token");
}

async function parseJson<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function apiRequest<T>(
  path: string,
  opts: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const t = resolveToken(opts.token);
  if (t) {
    headers.set("Authorization", `Bearer ${t}`);
  }
  if (opts.headers) {
    const incoming = new Headers(opts.headers);
    incoming.forEach((value, key) => headers.set(key, value));
  }
  const origin = getApiOrigin();
  const base = origin ? `${origin}/api/v1` : "/api/v1";
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...opts,
      headers,
      cache: "no-store",
    });
  } catch (e) {
    const hint =
      typeof navigator !== "undefined" && origin === ""
        ? " Cannot reach the API. Start the backend on port 8080 (see README)."
        : " Check NEXT_PUBLIC_API_URL and network connectivity.";
    const detail = e instanceof Error ? e.message : String(e);
    throw new ApiError(
      0,
      `Request failed (${detail}).${hint}`,
    );
  }
  if (!res.ok) {
    if (res.status === 502 || res.status === 504) {
      throw new ApiError(
        res.status,
        "API proxy could not reach the backend. Start the Go server on port 8080.",
      );
    }
    const body = await res.json().catch(() => ({}));
    const msg =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: string }).error)
        : res.statusText;
    throw new ApiError(res.status, msg);
  }
  return parseJson<T>(res);
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      token: null,
    }),
  register: (email: string, password: string, role?: string) =>
    apiRequest<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
      token: null,
    }),
  me: () => apiRequest<User>("/auth/me"),
  logout: () => apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST" }),
};

export const dashboardApi = {
  summary: () => apiRequest<DashboardSummary>("/dashboard/summary"),
};

export const insightsApi = {
  get: () => apiRequest<InsightsBundle>("/insights"),
};

export const productsApi = {
  list: (params?: {
    q?: string;
    categoryId?: string;
    lowStock?: boolean;
    expiring?: boolean;
  }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.categoryId) sp.set("categoryId", params.categoryId);
    if (params?.lowStock !== undefined)
      sp.set("lowStock", String(params.lowStock));
    if (params?.expiring !== undefined)
      sp.set("expiring", String(params.expiring));
    const qs = sp.toString();
    return apiRequest<Product[]>(`/products${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiRequest<Product>(`/products/${id}`),
  create: (body: Partial<Product> & Record<string, unknown>) =>
    apiRequest<Product>("/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<Product> & Record<string, unknown>) =>
    apiRequest<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    apiRequest<{ ok: boolean }>(`/products/${id}`, { method: "DELETE" }),
};

export const categoriesApi = {
  list: () => apiRequest<Category[]>("/categories"),
  create: (body: { name: string; description?: string }) =>
    apiRequest<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: { name: string; description?: string }) =>
    apiRequest<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    apiRequest<{ ok: boolean }>(`/categories/${id}`, { method: "DELETE" }),
};

export const suppliersApi = {
  list: () => apiRequest<Supplier[]>("/suppliers"),
  create: (body: Partial<Supplier>) =>
    apiRequest<Supplier>("/suppliers", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<Supplier>) =>
    apiRequest<Supplier>(`/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    apiRequest<{ ok: boolean }>(`/suppliers/${id}`, { method: "DELETE" }),
};

export const purchaseOrdersApi = {
  list: () => apiRequest<PurchaseOrder[]>("/purchase-orders"),
  get: (id: string) => apiRequest<PurchaseOrder>(`/purchase-orders/${id}`),
  create: (body: Record<string, unknown>) =>
    apiRequest<PurchaseOrder>("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Record<string, unknown>) =>
    apiRequest<PurchaseOrder>(`/purchase-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    apiRequest<{ ok: boolean }>(`/purchase-orders/${id}`, {
      method: "DELETE",
    }),
};
