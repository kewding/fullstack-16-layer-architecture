package vendorregister

import (
	"context"
	"fmt"

	"github.com/kewding/backend/internal/security"
)

type UseCase interface {
	Register(ctx context.Context, req VendorRegisterRequest) error
}

type vendorRegisterUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &vendorRegisterUseCase{repo: repo}
}

func (uc *vendorRegisterUseCase) Register(ctx context.Context, req VendorRegisterRequest) (err error) {
	// Step 1: Validate invite token and retrieve email
	email, err := uc.repo.GetInviteEmailByToken(ctx, req.Token)
	if err != nil {
		return err // ErrInviteInvalid bubbles up
	}

	// Step 2: Check email uniqueness
	exists, err := uc.repo.EmailExists(ctx, email)
	if err != nil {
		return fmt.Errorf("failed to check email: %w", err)
	}
	if exists {
		return ErrEmailExists
	}

	// Step 3: Hash password
	hashedPassword, err := security.HashPassword(req.Password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Step 4: Begin transaction
	tx, err := uc.repo.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
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

	// Step 5: Create user
	userID, err := uc.repo.CreateUser(ctx, tx, email, hashedPassword)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Step 6: Create user info
	if err = uc.repo.CreateUserInfo(ctx, tx, userID, req); err != nil {
		return fmt.Errorf("failed to create user info: %w", err)
	}

	// Step 7: Create stall
	if err = uc.repo.CreateStall(ctx, tx, userID, req.BusinessName); err != nil {
		return fmt.Errorf("failed to create stall: %w", err)
	}

	// Step 8: Create wallet
	if err = uc.repo.CreateWallet(ctx, tx, userID); err != nil {
		return fmt.Errorf("failed to create wallet: %w", err)
	}

	// Step 9: Update vendor record to for_review and populate user_id
	if err = uc.repo.CreateVendorRecord(ctx, tx, userID, email); err != nil {
		return fmt.Errorf("failed to update vendor record: %w", err)
	}

	// Step 10: Mark invite as used — inside same transaction so it rolls back if anything fails
	if err = uc.repo.MarkInviteUsed(ctx, tx, req.Token); err != nil {
		return fmt.Errorf("failed to mark invite as used: %w", err)
	}

	return nil
}
