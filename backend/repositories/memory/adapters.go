package memory

import (
	"context"

	"github.com/medical-ai-assistant/backend/models"
	"github.com/medical-ai-assistant/backend/repositories"
)

type UserRepo struct{ S *Store }

func (r UserRepo) Create(ctx context.Context, u *models.User) error {
	return r.S.CreateUser(ctx, u)
}

func (r UserRepo) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	return r.S.GetUserByEmail(ctx, email)
}

func (r UserRepo) GetByID(ctx context.Context, id string) (*models.User, error) {
	return r.S.GetUserByID(ctx, id)
}

type CategoryRepo struct{ S *Store }

func (r CategoryRepo) Create(ctx context.Context, c *models.Category) error {
	return r.S.CreateCategory(ctx, c)
}

func (r CategoryRepo) Update(ctx context.Context, c *models.Category) error {
	return r.S.UpdateCategory(ctx, c)
}

func (r CategoryRepo) Delete(ctx context.Context, id string) error {
	return r.S.DeleteCategory(ctx, id)
}

func (r CategoryRepo) List(ctx context.Context) ([]models.Category, error) {
	return r.S.ListCategories(ctx)
}

func (r CategoryRepo) GetByID(ctx context.Context, id string) (*models.Category, error) {
	return r.S.GetCategoryByID(ctx, id)
}

type ProductRepo struct{ S *Store }

func (r ProductRepo) Create(ctx context.Context, p *models.Product) error {
	return r.S.CreateProduct(ctx, p)
}

func (r ProductRepo) Update(ctx context.Context, p *models.Product) error {
	return r.S.UpdateProduct(ctx, p)
}

func (r ProductRepo) Delete(ctx context.Context, id string) error {
	return r.S.DeleteProduct(ctx, id)
}

func (r ProductRepo) GetByID(ctx context.Context, id string) (*models.Product, error) {
	return r.S.GetProductByID(ctx, id)
}

func (r ProductRepo) List(ctx context.Context, filter repositories.ProductFilter) ([]models.Product, error) {
	return r.S.ListProducts(ctx, filter)
}

type SupplierRepo struct{ S *Store }

func (r SupplierRepo) Create(ctx context.Context, s *models.Supplier) error {
	return r.S.CreateSupplier(ctx, s)
}

func (r SupplierRepo) Update(ctx context.Context, s *models.Supplier) error {
	return r.S.UpdateSupplier(ctx, s)
}

func (r SupplierRepo) Delete(ctx context.Context, id string) error {
	return r.S.DeleteSupplier(ctx, id)
}

func (r SupplierRepo) GetByID(ctx context.Context, id string) (*models.Supplier, error) {
	return r.S.GetSupplierByID(ctx, id)
}

func (r SupplierRepo) List(ctx context.Context) ([]models.Supplier, error) {
	return r.S.ListSuppliers(ctx)
}

type PurchaseOrderRepo struct{ S *Store }

func (r PurchaseOrderRepo) Create(ctx context.Context, po *models.PurchaseOrder) error {
	return r.S.CreatePurchaseOrder(ctx, po)
}

func (r PurchaseOrderRepo) Update(ctx context.Context, po *models.PurchaseOrder) error {
	return r.S.UpdatePurchaseOrder(ctx, po)
}

func (r PurchaseOrderRepo) Delete(ctx context.Context, id string) error {
	return r.S.DeletePurchaseOrder(ctx, id)
}

func (r PurchaseOrderRepo) GetByID(ctx context.Context, id string) (*models.PurchaseOrder, error) {
	return r.S.GetPurchaseOrderByID(ctx, id)
}

func (r PurchaseOrderRepo) List(ctx context.Context) ([]models.PurchaseOrder, error) {
	return r.S.ListPurchaseOrders(ctx)
}

type StockRepo struct{ S *Store }

func (r StockRepo) Append(ctx context.Context, productID string, delta int, reason string) error {
	return r.S.AppendStockEvent(ctx, productID, delta, reason)
}

func (r StockRepo) ListByProduct(ctx context.Context, productID string, limit int) ([]repositories.StockEvent, error) {
	return r.S.ListStockEventsByProduct(ctx, productID, limit)
}
