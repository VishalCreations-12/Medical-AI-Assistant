package repositories

import (
	"context"

	"github.com/medical-ai-assistant/backend/models"
)

type UserRepository interface {
	Create(ctx context.Context, u *models.User) error
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByID(ctx context.Context, id string) (*models.User, error)
}

type CategoryRepository interface {
	Create(ctx context.Context, c *models.Category) error
	Update(ctx context.Context, c *models.Category) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context) ([]models.Category, error)
	GetByID(ctx context.Context, id string) (*models.Category, error)
}

type ProductRepository interface {
	Create(ctx context.Context, p *models.Product) error
	Update(ctx context.Context, p *models.Product) error
	Delete(ctx context.Context, id string) error
	GetByID(ctx context.Context, id string) (*models.Product, error)
	List(ctx context.Context, filter ProductFilter) ([]models.Product, error)
}

type ProductFilter struct {
	Query      string
	CategoryID string
	LowStock   *bool
	Expiring   *bool
}

type SupplierRepository interface {
	Create(ctx context.Context, s *models.Supplier) error
	Update(ctx context.Context, s *models.Supplier) error
	Delete(ctx context.Context, id string) error
	GetByID(ctx context.Context, id string) (*models.Supplier, error)
	List(ctx context.Context) ([]models.Supplier, error)
}

type PurchaseOrderRepository interface {
	Create(ctx context.Context, po *models.PurchaseOrder) error
	Update(ctx context.Context, po *models.PurchaseOrder) error
	Delete(ctx context.Context, id string) error
	GetByID(ctx context.Context, id string) (*models.PurchaseOrder, error)
	List(ctx context.Context) ([]models.PurchaseOrder, error)
}

type StockEventRepository interface {
	Append(ctx context.Context, productID string, delta int, reason string) error
	ListByProduct(ctx context.Context, productID string, limit int) ([]StockEvent, error)
}

type StockEvent struct {
	At        string `json:"at"`
	ProductID string `json:"productId"`
	Delta     int    `json:"delta"`
	Reason    string `json:"reason"`
}
