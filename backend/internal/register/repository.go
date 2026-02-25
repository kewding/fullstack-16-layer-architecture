package register

import (
	"context"
)

type Repository interface {
	InstitutionalIDExists(ctx context.Context, institutionalID string) (bool, error)
	InstitutionalIDTaken(ctx context.Context, instID string) (bool, error)
	
	EmailExists(ctx context.Context, email string) (bool, error)

	BeginTx(ctx context.Context) (Tx, error)

	CreateUser(ctx context.Context, tx Tx, req RegisterRequest, hashedPassword string, roleSlug string) (string, error)
	CreateUserInfo(ctx context.Context, tx Tx, userID string, req RegisterRequest) error
	CreateUserInstLink(ctx context.Context, tx Tx, userID string, institutionalID string) (string, error)
	CreateUserRFIDLink(ctx context.Context, tx Tx, userID string, rfidTag string) error
}

type Tx interface {
    Commit(ctx context.Context) error
    Rollback(ctx context.Context) error
}   

