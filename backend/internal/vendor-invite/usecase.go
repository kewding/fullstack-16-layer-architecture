package vendorinvite

import (
	"context"
	"fmt"

	"github.com/kewding/backend/internal/security"
)

type UseCase interface {
	SendInvite(ctx context.Context, req SendInviteRequest) error
	ValidateToken(ctx context.Context, token string) (*ValidateTokenResponse, error)
	ResendInvite(ctx context.Context, email string, invitedBy string) error
	GetExpiredInvite(ctx context.Context, token string) (*InviteTokenResponse, error)
	RevokeVendor(ctx context.Context, vendorID string) error
}

type vendorInviteUseCase struct {
	repo        Repository
	emailSender EmailSender
}

func NewUseCase(repo Repository, emailSender EmailSender) UseCase {
	return &vendorInviteUseCase{repo: repo, emailSender: emailSender}
}

func (uc *vendorInviteUseCase) SendInvite(ctx context.Context, req SendInviteRequest) error {
	// Step 1: Check for existing pending invite
	hasPending, err := uc.repo.HasPendingInvite(ctx, req.Email)
	if err != nil {
		return fmt.Errorf("failed to check pending invite: %w", err)
	}
	if hasPending {
		return ErrEmailAlreadyUsed
	}

	// Step 2: Generate token
	token := security.GenerateRandomToken()

	// Step 3: Send email FIRST — before touching the DB
	if err := uc.emailSender.SendInviteEmail(req.Email, req.OwnerName, token); err != nil {
		return fmt.Errorf("failed to send invite email: %w", err)
	}

	// Step 4: Only save to DB if email succeeded
	if err := uc.repo.CreateInvite(ctx, token, req.Email, req.OwnerName, req.InvitedBy); err != nil {
		return fmt.Errorf("failed to store invite: %w", err)
	}

	// Step 5: Create vendor invited record
	if err := uc.repo.CreateVendorInvitedRecord(ctx, req.Email, req.OwnerName); err != nil {
		return fmt.Errorf("failed to create vendor record: %w", err)
	}

	return nil
}

func (uc *vendorInviteUseCase) ValidateToken(ctx context.Context, token string) (*ValidateTokenResponse, error) {
	invite, err := uc.repo.GetInviteByToken(ctx, token)
	if err != nil {
		return nil, err // ErrInviteNotFound, ErrInviteExpired, ErrInviteUsed
	}

	return &ValidateTokenResponse{
		Email: invite.Email,
		Token: token,
	}, nil
}

func (uc *vendorInviteUseCase) ResendInvite(ctx context.Context, email string, invitedBy string) error {
	// Invalidate old invite
	if err := uc.repo.InvalidateExistingInvite(ctx, email); err != nil {
		return fmt.Errorf("failed to invalidate old invite: %w", err)
	}

	// Generate new token and send
	return uc.SendInvite(ctx, SendInviteRequest{
		Email:     email,
		InvitedBy: invitedBy,
	})
}

func (uc *vendorInviteUseCase) GetExpiredInvite(ctx context.Context, token string) (*InviteTokenResponse, error) {
	return uc.repo.GetExpiredInvite(ctx, token)
}

func (uc *vendorInviteUseCase) RevokeVendor(ctx context.Context, vendorID string) error {
	// Step 1: Get vendor details for the revocation email
	vendor, err := uc.repo.GetVendorByID(ctx, vendorID)
	if err != nil {
		return err // ErrInviteNotFound or ErrCannotRevoke bubble up
	}

	// Step 2: Send revocation email first
	if err := uc.emailSender.SendRevocationEmail(vendor.Email, vendor.OwnerName); err != nil {
		return fmt.Errorf("failed to send revocation email: %w", err)
	}

	// Step 3: Hard delete from DB only after email succeeds
	if err := uc.repo.RevokeVendor(ctx, vendorID); err != nil {
		return fmt.Errorf("failed to revoke vendor: %w", err)
	}

	return nil
}
