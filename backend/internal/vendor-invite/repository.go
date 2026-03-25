package vendorinvite

import "context"

type Repository interface {
	CreateInvite(ctx context.Context, token string, email string, invitedBy string) error

	GetInviteByToken(ctx context.Context, token string) (*InviteTokenResponse, error)
	GetInviteByEmail(ctx context.Context, email string) (*InviteTokenResponse, error)
	GetExpiredInvite(ctx context.Context, token string) (*InviteTokenResponse, error)

	InvalidateExistingInvite(ctx context.Context, email string) error

	MarkInviteUsed(ctx context.Context, token string) error
	HasPendingInvite(ctx context.Context, email string) (bool, error)
	
	CreateVendorInvitedRecord(ctx context.Context, email string) error
}