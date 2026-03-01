package login

import (
	"context"
	"time"
)

type User struct {
	ID           string
	Email        string
	PasswordHash string
	RoleID       int
}

type Repository interface {
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	EmailExists(ctx context.Context, email string) (bool, error)
	SaveSession(ctx context.Context, token string, userID string, expiresAt time.Time) error
	VerifySession(ctx context.Context, token string) (*UserSessionDTO, error)
}

type Tx interface {
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}
