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
	// Check admin ID table first
	isAdmin, err := u.repo.AdminIDExists(ctx, institutionalID)
	if err != nil {
		return fmt.Errorf("failed to check admin ID: %w", err)
	}
	if isAdmin {
		// admin IDs are never "taken" in users_inst_id
		// each admin ID can only be used once — check if already registered
		taken, err := u.repo.InstitutionalIDTaken(ctx, institutionalID)
		if err != nil {
			return fmt.Errorf("failed to check availability: %w", err)
		}
		if taken {
			return ErrInstitutionalIDAlreadyTaken
		}
		return nil // valid admin ID
	}

	// Fall through to customer ID check
	found, err := u.repo.InstitutionalIDExists(ctx, institutionalID)
	if err != nil || !found {
		return ErrInstitutionalIDNotFound
	}

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
	tx, err := u.repo.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("%w: cannot start transaction: %v", ErrRegistrationFailed, err)
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback(ctx)
			panic(p)
		} else if err != nil {
			tx.Rollback(ctx)
		} else {
			err = tx.Commit(ctx)
		}
	}()

	// Determine role based on which ID table the institutional ID belongs to
	isAdmin, err := u.repo.AdminIDExists(ctx, req.InstitutionalID)
	if err != nil {
		return fmt.Errorf("%w: failed to determine role: %v", ErrRegistrationFailed, err)
	}

	roleSlug := "customer"
	if isAdmin {
		roleSlug = "admin"
	}

	const rfidTag = ""

	hashedPassword, err := security.HashPassword(req.Password)
	if err != nil {
		return fmt.Errorf("%w: failed to hash password: %v", ErrRegistrationFailed, err)
	}

	userID, err := u.repo.CreateUser(ctx, tx, req, hashedPassword, roleSlug)
	if err != nil {
		return fmt.Errorf("%w: failed to create user: %v", ErrRegistrationFailed, err)
	}

	if err := u.repo.CreateUserInfo(ctx, tx, userID, req); err != nil {
		return fmt.Errorf("%w: failed to create user info: %v", ErrRegistrationFailed, err)
	}

	_, err = u.repo.CreateUserInstLink(ctx, tx, userID, req.InstitutionalID)
	if err != nil {
		return fmt.Errorf("%w: failed to link user to institutional ID: %v", ErrRegistrationFailed, err)
	}

	if err := u.repo.CreateUserRFIDLink(ctx, tx, userID, rfidTag); err != nil {
		return fmt.Errorf("%w: failed to create RFID link: %v", ErrRegistrationFailed, err)
	}

	// Only create wallet for customer and vendor roles
	walletRoles := map[string]bool{
		"customer": true,
		"vendor":   true,
	}
	if walletRoles[roleSlug] {
		if err := u.repo.CreateWallet(ctx, tx, userID); err != nil {
			return fmt.Errorf("%w: failed to create wallet: %v", ErrRegistrationFailed, err)
		}
	}

	return nil
}
