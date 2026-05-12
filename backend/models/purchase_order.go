package models

import "time"

type PurchaseOrderStatus string

const (
	StatusDraft     PurchaseOrderStatus = "draft"
	StatusSubmitted PurchaseOrderStatus = "submitted"
	StatusApproved  PurchaseOrderStatus = "approved"
	StatusOrdered   PurchaseOrderStatus = "ordered"
	StatusReceived  PurchaseOrderStatus = "received"
	StatusCancelled PurchaseOrderStatus = "cancelled"
)

type PurchaseOrderLine struct {
	ID          string  `json:"id"`
	ProductID   string  `json:"productId"`
	Quantity    int     `json:"quantity"`
	UnitCost    float64 `json:"unitCost"`
	ProductName string  `json:"productName,omitempty"`
}

type PurchaseOrder struct {
	ID              string              `json:"id"`
	SupplierID      string              `json:"supplierId"`
	SupplierName    string              `json:"supplierName,omitempty"`
	Status          PurchaseOrderStatus `json:"status"`
	Lines           []PurchaseOrderLine `json:"lines"`
	Notes           string              `json:"notes"`
	TotalAmount     float64             `json:"totalAmount"`
	ExpectedDate    *time.Time          `json:"expectedDate,omitempty"`
	CreatedAt       time.Time           `json:"createdAt"`
	UpdatedAt       time.Time           `json:"updatedAt"`
}
