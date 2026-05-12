package memory

import (
	"context"
	"errors"

	"github.com/medical-ai-assistant/backend/models"
)

func (s *Store) CreateUser(ctx context.Context, u *models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	email := normalizeEmail(u.Email)
	if _, exists := s.usersByEmail[email]; exists {
		return errors.New("email already registered")
	}
	s.usersByID[u.ID] = u
	s.usersByEmail[email] = u.ID
	return nil
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	id, ok := s.usersByEmail[normalizeEmail(email)]
	if !ok {
		return nil, errors.New("not found")
	}
	u := s.usersByID[id]
	if u == nil {
		return nil, errors.New("not found")
	}
	cp := *u
	return &cp, nil
}

func (s *Store) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u := s.usersByID[id]
	if u == nil {
		return nil, errors.New("not found")
	}
	cp := *u
	return &cp, nil
}
