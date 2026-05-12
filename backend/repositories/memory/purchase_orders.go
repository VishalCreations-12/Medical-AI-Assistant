package memory

import (
	"context"
	"errors"
	"sort"

	"github.com/medical-ai-assistant/backend/models"
)

func (s *Store) CreatePurchaseOrder(ctx context.Context, po *models.PurchaseOrder) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.purchaseOrders[po.ID] = po
	return nil
}

func (s *Store) UpdatePurchaseOrder(ctx context.Context, po *models.PurchaseOrder) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.purchaseOrders[po.ID] == nil {
		return errors.New("not found")
	}
	s.purchaseOrders[po.ID] = po
	return nil
}

func (s *Store) DeletePurchaseOrder(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.purchaseOrders[id] == nil {
		return errors.New("not found")
	}
	delete(s.purchaseOrders, id)
	return nil
}

func (s *Store) GetPurchaseOrderByID(ctx context.Context, id string) (*models.PurchaseOrder, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	po := s.purchaseOrders[id]
	if po == nil {
		return nil, errors.New("not found")
	}
	cp := *po
	cp.Lines = append([]models.PurchaseOrderLine(nil), po.Lines...)
	return &cp, nil
}

func (s *Store) ListPurchaseOrders(ctx context.Context) ([]models.PurchaseOrder, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.PurchaseOrder, 0, len(s.purchaseOrders))
	for _, po := range s.purchaseOrders {
		cp := *po
		cp.Lines = append([]models.PurchaseOrderLine(nil), po.Lines...)
		out = append(out, cp)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreatedAt.After(out[j].CreatedAt) })
	return out, nil
}
