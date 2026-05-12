package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/medical-ai-assistant/backend/models"
	"github.com/medical-ai-assistant/backend/repositories"
	"github.com/medical-ai-assistant/backend/utils"
)

type AuthService struct {
	Users    repositories.UserRepository
	JWTSecret string
}

type RegisterInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     models.Role `json:"role"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  models.User  `json:"user"`
}

func (s *AuthService) Register(ctx context.Context, in RegisterInput) (*AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if in.Role == "" {
		in.Role = models.RoleViewer
	}
	if in.Role != models.RoleViewer && in.Role != models.RoleManager {
		in.Role = models.RoleViewer
	}
	hash, err := utils.HashPassword(in.Password)
	if err != nil {
		return nil, err
	}
	u := &models.User{
		ID:           uuid.NewString(),
		Email:        email,
		PasswordHash: hash,
		Role:         in.Role,
		CreatedAt:    time.Now().UTC(),
	}
	if err := s.Users.Create(ctx, u); err != nil {
		return nil, err
	}
	token, err := utils.SignJWT(s.JWTSecret, u.ID, u.Role, 72*time.Hour)
	if err != nil {
		return nil, err
	}
	out := models.User{ID: u.ID, Email: u.Email, Role: u.Role, CreatedAt: u.CreatedAt}
	return &AuthResponse{Token: token, User: out}, nil
}

func (s *AuthService) Login(ctx context.Context, in LoginInput) (*AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))
	u, err := s.Users.GetByEmail(ctx, email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}
	if !utils.ComparePassword(u.PasswordHash, in.Password) {
		return nil, errors.New("invalid credentials")
	}
	token, err := utils.SignJWT(s.JWTSecret, u.ID, u.Role, 72*time.Hour)
	if err != nil {
		return nil, err
	}
	out := models.User{ID: u.ID, Email: u.Email, Role: u.Role, CreatedAt: u.CreatedAt}
	return &AuthResponse{Token: token, User: out}, nil
}

func (s *AuthService) Me(ctx context.Context, userID string) (*models.User, error) {
	u, err := s.Users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &models.User{ID: u.ID, Email: u.Email, Role: u.Role, CreatedAt: u.CreatedAt}, nil
}
