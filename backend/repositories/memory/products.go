package memory

import (
	"context"
	"errors"
	"sort"
	"strings"

	"github.com/medical-ai-assistant/backend/models"
	"github.com/medical-ai-assistant/backend/repositories"
)

func (s *Store) CreateProduct(ctx context.Context, p *models.Product) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, existing := range s.products {
		if strings.EqualFold(existing.SKU, p.SKU) {
			return errors.New("sku already exists")
		}
	}
	s.products[p.ID] = p
	return nil
}

func (s *Store) UpdateProduct(ctx context.Context, p *models.Product) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.products[p.ID] == nil {
		return errors.New("not found")
	}
	for id, existing := range s.products {
		if id != p.ID && strings.EqualFold(existing.SKU, p.SKU) {
			return errors.New("sku already exists")
		}
	}
	s.products[p.ID] = p
	return nil
}

func (s *Store) DeleteProduct(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.products[id] == nil {
		return errors.New("not found")
	}
	delete(s.products, id)
	return nil
}

func (s *Store) GetProductByID(ctx context.Context, id string) (*models.Product, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p := s.products[id]
	if p == nil {
		return nil, errors.New("not found")
	}
	cp := *p
	return &cp, nil
}

func (s *Store) ListProducts(ctx context.Context, filter repositories.ProductFilter) ([]models.Product, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Product, 0)
	for _, p := range s.products {
		if matchesProduct(p, filter) {
			cp := *p
			out = append(out, cp)
		}
	}
	sort.Slice(out, func(i, j int) bool { return strings.ToLower(out[i].Name) < strings.ToLower(out[j].Name) })
	return out, nil
}
