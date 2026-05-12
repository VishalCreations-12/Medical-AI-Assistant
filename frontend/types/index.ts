export type Role = "admin" | "manager" | "viewer";

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  stockQuantity: number;
  lowStockThreshold: number;
  unitPrice: number;
  expiryDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  createdAt: string;
}

export type PurchaseOrderStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "ordered"
  | "received"
  | "cancelled";

export interface PurchaseOrderLine {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  productName?: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName?: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  notes: string;
  totalAmount: number;
  expectedDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  inventoryValue: number;
  skuCount: number;
  lowStockCount: number;
  expiringSoonCount: number;
  openOrders: number;
  monthlySpend: { month: string; value: number }[];
  categoryMix: { category: string; value: number }[];
  revenueEstimate: number;
}

export interface InsightsBundle {
  recommendations: {
    productId: string;
    name: string;
    sku: string;
    suggestedQty: number;
    reason: string;
    urgency: string;
    estimatedCost: number;
  }[];
  lowStockPredictions: {
    productId: string;
    name: string;
    daysUntilStockout: number;
    confidence: string;
  }[];
  trends: { month: string; netChange: number }[];
}
