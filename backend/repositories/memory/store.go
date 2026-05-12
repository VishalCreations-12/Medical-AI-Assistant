package memory

import (
	"strings"
	"sync"
	"time"

	"github.com/medical-ai-assistant/backend/models"
	"github.com/medical-ai-assistant/backend/repositories"
)

type Store struct {
	mu             sync.RWMutex
	usersByID      map[string]*models.User
	usersByEmail   map[string]string
	categories     map[string]*models.Category
	products       map[string]*models.Product
	suppliers      map[string]*models.Supplier
	purchaseOrders map[string]*models.PurchaseOrder
	stockEvents    []repositories.StockEvent
}

func NewStore() *Store {
	return &Store{
		usersByID:      make(map[string]*models.User),
		usersByEmail:   make(map[string]string),
		categories:     make(map[string]*models.Category),
		products:       make(map[string]*models.Product),
		suppliers:      make(map[string]*models.Supplier),
		purchaseOrders: make(map[string]*models.PurchaseOrder),
		stockEvents:    make([]repositories.StockEvent, 0),
	}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func matchesProduct(p *models.Product, f repositories.ProductFilter) bool {
	if f.CategoryID != "" && p.CategoryID != f.CategoryID {
		return false
	}
	if f.Query != "" {
		q := strings.ToLower(f.Query)
		if !strings.Contains(strings.ToLower(p.Name), q) && !strings.Contains(strings.ToLower(p.SKU), q) {
			return false
		}
	}
	if f.LowStock != nil && *f.LowStock {
		if p.StockQuantity > p.LowStockThreshold {
			return false
		}
	}
	if f.Expiring != nil && *f.Expiring {
		if p.ExpiryDate == nil {
			return false
		}
		if time.Until(*p.ExpiryDate) > 90*24*time.Hour {
			return false
		}
	}
	return true
}
