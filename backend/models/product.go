package models

import "time"

type Product struct {
	ID                string     `json:"id"`
	Name              string     `json:"name"`
	SKU               string     `json:"sku"`
	CategoryID        string     `json:"categoryId"`
	StockQuantity     int        `json:"stockQuantity"`
	LowStockThreshold int        `json:"lowStockThreshold"`
	UnitPrice         float64    `json:"unitPrice"`
	ExpiryDate        *time.Time `json:"expiryDate,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}
