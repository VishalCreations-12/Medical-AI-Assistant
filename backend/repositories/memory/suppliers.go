package memory

import (
	"context"
	"errors"
	"sort"

	"github.com/medical-ai-assistant/backend/models"
)

func (s *Store) CreateSupplier(ctx context.Context, sup *models.Supplier) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.suppliers[sup.ID] = sup
	return nil
}

func (s *Store) UpdateSupplier(ctx context.Context, sup *models.Supplier) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.suppliers[sup.ID] == nil {
		return errors.New("not found")
	}
	s.suppliers[sup.ID] = sup
	return nil
}

func (s *Store) DeleteSupplier(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.suppliers[id] == nil {
		return errors.New("not found")
	}
	delete(s.suppliers, id)
	return nil
}

func (s *Store) GetSupplierByID(ctx context.Context, id string) (*models.Supplier, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sup := s.suppliers[id]
	if sup == nil {
		return nil, errors.New("not found")
	}
	cp := *sup
	return &cp, nil
}

func (s *Store) ListSuppliers(ctx context.Context) ([]models.Supplier, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Supplier, 0, len(s.suppliers))
	for _, sup := range s.suppliers {
		out = append(out, *sup)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out, nil
}
