package register

import (
	"context"
	"fmt"

	"github.com/kewding/backend/internal/security"
)

type UseCase interface {
	CheckInstitutionalID(ctx context.Context, institutionalID string) error
	CheckEmail(ctx context.Context, email string) error
	Register(ctx context.Context, req RegisterRequest) error
}

type useCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &useCase{repo: repo}
}

// Step 1: Check Institutional ID
// if institutional ID is valid, check for availability ***
func (u *useCase) CheckInstitutionalID(ctx context.Context, institutionalID string) error {
    // 1. Check if it exists in master list
    found, err := u.repo.InstitutionalIDExists(ctx, institutionalID)
    if err != nil || !found {
        return ErrInstitutionalIDNotFound
    }

    // 2. Check if it is already taken (Requirement #3)
    taken, err := u.repo.InstitutionalIDTaken(ctx, institutionalID)
    if err != nil {
        return fmt.Errorf("failed to check availability: %w", err)
    }
    if taken {
        return ErrInstitutionalIDAlreadyTaken
    }
    return nil
}

// Step 2: Check Email
func (u *useCase) CheckEmail(ctx context.Context, email string) error {
	exists, err := u.repo.EmailExists(ctx, email)
	if err != nil {
		return fmt.Errorf("failed to check email existence: %w", err)
	}
	if exists {
		return ErrEmailAlreadyExists
	}
	return nil
}

// Step 3-4: Register User
func (u *useCase) Register(ctx context.Context, req RegisterRequest) (err error) {
	// Start transaction
	tx, err := u.repo.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("%w: cannot start transaction: %v", ErrRegistrationFailed, err)
	}

	// Ensure proper rollback/commit
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback(ctx)
			panic(p) // propagate panic after rollback
		} else if err != nil {
			tx.Rollback(ctx)
		} else {
			err = tx.Commit(ctx)
		}
	}()

	// Requirement #1: Only customers allowed for this flow
    const roleSlug = "customer" 
    // Requirement #2: RFID is always null/empty during initial registration
    const rfidTag = "" 

	// Hash password
    hashedPassword, _ := security.HashPassword(req.Password)

	// Insert into users
	userID, err := u.repo.CreateUser(ctx, tx, req, hashedPassword, roleSlug)
	if err != nil {
		return fmt.Errorf("%w: failed to create user: %v", ErrRegistrationFailed, err)
	}

	// Insert into users_info
	if err := u.repo.CreateUserInfo(ctx, tx, userID, req); err != nil {
		return fmt.Errorf("%w: failed to create user info: %v", ErrRegistrationFailed, err)
	}

	// Insert into users_inst_link (resolve PK internally in repo)
	_, err = u.repo.CreateUserInstLink(ctx, tx, userID, req.InstitutionalID)
if err != nil {
    return fmt.Errorf("%w: failed to link user to institutional ID: %v", ErrRegistrationFailed, err)
}

	// Insert into users_rfid_link (nullable rfid_tag)
	if err := u.repo.CreateUserRFIDLink(ctx, tx, userID, rfidTag); err != nil {
		return fmt.Errorf("%w: failed to create RFID link: %v", ErrRegistrationFailed, err)
	}

	return nil
}