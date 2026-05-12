package memory

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/medical-ai-assistant/backend/models"
	"github.com/medical-ai-assistant/backend/utils"
)

func SeedDemoData(store *Store) error {
	ctx := context.Background()
	hash, err := utils.HashPassword("SwasthyaIndia2026!")
	if err != nil {
		return err
	}
	adminID := uuid.NewString()
	u := &models.User{
		ID:           adminID,
		Email:        "admin@swasthya-ai.in",
		PasswordHash: hash,
		Role:         models.RoleAdmin,
		CreatedAt:    time.Now().UTC(),
	}
	if err := store.CreateUser(ctx, u); err != nil {
		return err
	}

	catPharma := &models.Category{ID: uuid.NewString(), Name: "Pharmaceuticals", Description: "Rx and OTC medicines", CreatedAt: time.Now().UTC()}
	catSurgical := &models.Category{ID: uuid.NewString(), Name: "Surgical Supplies", Description: "Instruments and drapes", CreatedAt: time.Now().UTC()}
	catDiag := &models.Category{ID: uuid.NewString(), Name: "Diagnostics", Description: "Reagents and rapid tests", CreatedAt: time.Now().UTC()}
	_ = store.CreateCategory(ctx, catPharma)
	_ = store.CreateCategory(ctx, catSurgical)
	_ = store.CreateCategory(ctx, catDiag)

	supA := &models.Supplier{ID: uuid.NewString(), Name: "Apollo Surgicals India Pvt Ltd", Email: "procurement@apollo-surgicals.in", Phone: "+91-22-67432100", Country: "India", CreatedAt: time.Now().UTC()}
	supB := &models.Supplier{ID: uuid.NewString(), Name: "Redcliffe Lifesciences India", Email: "supply@redcliffe.in", Phone: "+91-124-44556677", Country: "India", CreatedAt: time.Now().UTC()}
	_ = store.CreateSupplier(ctx, supA)
	_ = store.CreateSupplier(ctx, supB)

	expSoon := time.Now().UTC().AddDate(0, 0, 45)
	expLater := time.Now().UTC().AddDate(0, 6, 0)

	p1 := &models.Product{
		ID: uuid.NewString(), Name: "Amoxicillin 500mg", SKU: "RX-AMX-500",
		CategoryID: catPharma.ID, StockQuantity: 120, LowStockThreshold: 80,
		UnitPrice: 1480, ExpiryDate: &expLater, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	p2 := &models.Product{
		ID: uuid.NewString(), Name: "Sterile Gauze 4x4", SKU: "SU-GAU-44",
		CategoryID: catSurgical.ID, StockQuantity: 40, LowStockThreshold: 100,
		UnitPrice: 520, ExpiryDate: nil, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	p3 := &models.Product{
		ID: uuid.NewString(), Name: "HbA1c Reagent Kit", SKU: "DX-HBA1C-01",
		CategoryID: catDiag.ID, StockQuantity: 55, LowStockThreshold: 30,
		UnitPrice: 18200, ExpiryDate: &expSoon, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	_ = store.CreateProduct(ctx, p1)
	_ = store.CreateProduct(ctx, p2)
	_ = store.CreateProduct(ctx, p3)

	_ = store.AppendStockEvent(ctx, p1.ID, 40, "seed")
	_ = store.AppendStockEvent(ctx, p1.ID, -12, "consumption")
	_ = store.AppendStockEvent(ctx, p2.ID, -60, "consumption")

	po := &models.PurchaseOrder{
		ID:           uuid.NewString(),
		SupplierID:   supA.ID,
		SupplierName: supA.Name,
		Status:       models.StatusOrdered,
		Lines: []models.PurchaseOrderLine{
			{ID: uuid.NewString(), ProductID: p2.ID, Quantity: 200, UnitCost: 385, ProductName: p2.Name},
		},
		Notes:       "Restock gauze – Bengaluru warehouse",
		TotalAmount: 200 * 385,
		ExpectedDate: ptrTime(time.Now().UTC().AddDate(0, 0, 14)),
		CreatedAt: time.Now().UTC().AddDate(0, 0, -3),
		UpdatedAt: time.Now().UTC(),
	}
	return store.CreatePurchaseOrder(ctx, po)
}

func ptrTime(t time.Time) *time.Time {
	return &t
}
