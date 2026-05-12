package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/medical-ai-assistant/backend/models"
)

type UserRepository struct {
	DB *sql.DB
}

func (r *UserRepository) Create(ctx context.Context, u *models.User) error {
	if r.DB == nil {
		return errors.New("database connection not configured")
	}
	_, err := r.DB.ExecContext(ctx,
		`INSERT INTO users (id, email, password_hash, role, created_at)
		 VALUES ($1, $2, $3, $4, $5)`,
		u.ID, u.Email, u.PasswordHash, string(u.Role), u.CreatedAt,
	)
	return err
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	if r.DB == nil {
		return nil, errors.New("database connection not configured")
	}
	row := r.DB.QueryRowContext(ctx,
		`SELECT id, email, password_hash, role, created_at FROM users WHERE lower(email) = lower($1)`,
		email,
	)
	var out models.User
	var role string
	if err := row.Scan(&out.ID, &out.Email, &out.PasswordHash, &role, &out.CreatedAt); err != nil {
		return nil, err
	}
	out.Role = models.Role(role)
	return &out, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	if r.DB == nil {
		return nil, errors.New("database connection not configured")
	}
	row := r.DB.QueryRowContext(ctx,
		`SELECT id, email, password_hash, role, created_at FROM users WHERE id = $1`,
		id,
	)
	var out models.User
	var role string
	if err := row.Scan(&out.ID, &out.Email, &out.PasswordHash, &role, &out.CreatedAt); err != nil {
		return nil, err
	}
	out.Role = models.Role(role)
	return &out, nil
}
