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
	// Step 1: Block only if the email belongs to an ACTIVE (non-deleted) user.
	// Graduated vendors have their users row soft-deleted (deleted_at IS NOT NULL),
	// so IsEmailRegistered returns false for them — re-invites are allowed.
	registered, err := uc.repo.IsEmailRegistered(ctx, req.Email)
	if err != nil {
		return fmt.Errorf("failed to check email: %w", err)
	}
	if registered {
		return ErrEmailAlreadyRegistered
	}

	// Step 2: Block only if there is an active non-expired pending invite.
	// After graduation the old vendor_invitation row is soft-deleted, so this
	// returns false and the re-invite proceeds normally.
	hasPending, err := uc.repo.HasPendingInvite(ctx, req.Email)
	if err != nil {
		return fmt.Errorf("failed to check pending invite: %w", err)
	}
	if hasPending {
		return ErrEmailAlreadyUsed
	}

	// Step 3: Generate token
	token := security.GenerateRandomToken()

	// Step 4: Send email first
	if err := uc.emailSender.SendInviteEmail(req.Email, req.OwnerName, token); err != nil {
		return fmt.Errorf("failed to send invite email: %w", err)
	}

	// Step 5: Save invitation to DB only after email succeeds
	if err := uc.repo.CreateInvite(ctx, token, req.Email, req.OwnerName, req.InvitedBy); err != nil {
		return fmt.Errorf("failed to store invite: %w", err)
	}

	// Step 6: Upsert vendors row.
	// For a brand-new invite: inserts a fresh 'invited' row.
	// For a re-invite of a graduated vendor (deleted_at IS NOT NULL):
	//   the ON CONFLICT clause in CreateVendorInvitedRecord reactivates the existing
	//   soft-deleted row (sets deleted_at = NULL, status = 'invited').
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
	return uc.SendInvite(ctx, SendInviteRequest{
		Email:     email,
		InvitedBy: invitedBy,
	})
}

func (uc *vendorInviteUseCase) GetExpiredInvite(ctx context.Context, token string) (*InviteTokenResponse, error) {
	return uc.repo.GetExpiredInvite(ctx, token)
}

func (uc *vendorInviteUseCase) RevokeVendor(ctx context.Context, vendorID string) error {
	vendor, err := uc.repo.GetVendorByID(ctx, vendorID)
	if err != nil {
		return err
	}

	if err := uc.emailSender.SendRevocationEmail(vendor.Email, vendor.OwnerName); err != nil {
		return fmt.Errorf("failed to send revocation email: %w", err)
	}

	if err := uc.repo.RevokeVendor(ctx, vendorID); err != nil {
		return fmt.Errorf("failed to revoke vendor: %w", err)
	}

	return nil
}