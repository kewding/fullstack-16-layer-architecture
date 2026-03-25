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
}

type vendorInviteUseCase struct {
	repo        Repository
	emailSender EmailSender
}

func NewUseCase(repo Repository, emailSender EmailSender) UseCase {
	return &vendorInviteUseCase{repo: repo, emailSender: emailSender}
}

func (uc *vendorInviteUseCase) SendInvite(ctx context.Context, req SendInviteRequest) error {
	hasPending, err := uc.repo.HasPendingInvite(ctx, req.Email)
	if err != nil {
		return fmt.Errorf("failed to check pending invite: %w", err)
	}
	if hasPending {
		return ErrEmailAlreadyUsed
	}

	token := security.GenerateRandomToken()

	if err := uc.repo.CreateInvite(ctx, token, req.Email, req.InvitedBy); err != nil {
		return fmt.Errorf("failed to store invite: %w", err)
	}

	// Insert vendor row with invited status at invite time
	if err := uc.repo.CreateVendorInvitedRecord(ctx, req.Email); err != nil {
		return fmt.Errorf("failed to create vendor record: %w", err)
	}

	if err := uc.emailSender.SendInviteEmail(req.Email, token); err != nil {
		return fmt.Errorf("failed to send invite email: %w", err)
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