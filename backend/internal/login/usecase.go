package login

import (
	"context"
	"time"

	"github.com/kewding/backend/internal/security"
)

type UseCase interface {
	// Updated to return the string (token)
	Login(ctx context.Context, req LoginRequest) (*User, string, error)
}

type useCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &useCase{repo: repo}
}

func (u *useCase) Login(ctx context.Context, req LoginRequest) (*User, string, error) {
	// verify existence
	exists, err := u.repo.EmailExists(ctx, req.Email)
	if err != nil || !exists {
		return nil, "", ErrInvalidCredentials
	}

	// retrieve credential
	user, err := u.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// compare password input from passord_hash
	if !security.ComparePassword(user.PasswordHash, req.Password) {
		return nil, "", ErrInvalidCredentials
	}

	// generate token
    token := security.GenerateRandomToken() 

	expiresAt := time.Now().Add(24 * time.Hour)

    // persiste session through repository
    if err := u.repo.SaveSession(ctx, token, user.ID, expiresAt); err != nil {
        return nil, "", err
    }

    return user, token, nil
}