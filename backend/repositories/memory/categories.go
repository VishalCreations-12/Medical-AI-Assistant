package memory

import (
	"context"
	"errors"
	"sort"

	"github.com/medical-ai-assistant/backend/models"
)

func (s *Store) CreateCategory(ctx context.Context, c *models.Category) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.categories[c.ID] = c
	return nil
}

func (s *Store) UpdateCategory(ctx context.Context, c *models.Category) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.categories[c.ID] == nil {
		return errors.New("not found")
	}
	s.categories[c.ID] = c
	return nil
}

func (s *Store) DeleteCategory(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.categories[id] == nil {
		return errors.New("not found")
	}
	delete(s.categories, id)
	return nil
}

func (s *Store) ListCategories(ctx context.Context) ([]models.Category, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Category, 0, len(s.categories))
	for _, c := range s.categories {
		out = append(out, *c)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out, nil
}

func (s *Store) GetCategoryByID(ctx context.Context, id string) (*models.Category, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c := s.categories[id]
	if c == nil {
		return nil, errors.New("not found")
	}
	cp := *c
	return &cp, nil
}
