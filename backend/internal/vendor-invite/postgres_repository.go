package vendorinvite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

func (r *postgresRepository) CreateInvite(ctx context.Context, token string, email string, invitedBy string) error {
	query := `
		INSERT INTO vendor_invitations (token, email, invited_by, expires_at)
		VALUES ($1, $2, $3, $4)`

	expiresAt := time.Now().Add(72 * time.Hour)
	_, err := r.db.ExecContext(ctx, query, token, email, invitedBy, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to create invite: %w", err)
	}
	return nil
}

func (r *postgresRepository) GetInviteByToken(ctx context.Context, token string) (*InviteTokenResponse, error) {
	query := `
		SELECT email, expires_at, status
		FROM vendor_invitations
		WHERE token = $1`

	var res InviteTokenResponse
	var status string
	err := r.db.QueryRowContext(ctx, query, token).Scan(&res.Email, &res.ExpiresAt, &status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInviteNotFound
		}
		return nil, fmt.Errorf("failed to get invite: %w", err)
	}

	if status == "used" {
		return nil, ErrInviteUsed
	}
	if time.Now().After(res.ExpiresAt) || status == "expired" {
		return nil, ErrInviteExpired
	}

	return &res, nil
}

func (r *postgresRepository) GetInviteByEmail(ctx context.Context, email string) (*InviteTokenResponse, error) {
	query := `
		SELECT email, expires_at
		FROM vendor_invitations
		WHERE email = $1
		ORDER BY created_at DESC
		LIMIT 1`

	var res InviteTokenResponse
	err := r.db.QueryRowContext(ctx, query, email).Scan(&res.Email, &res.ExpiresAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInviteNotFound
		}
		return nil, fmt.Errorf("failed to get invite by email: %w", err)
	}
	return &res, nil
}

func (r *postgresRepository) GetExpiredInvite(ctx context.Context, token string) (*InviteTokenResponse, error) {
	query := `
		SELECT email, expires_at
		FROM vendor_invitations
		WHERE token = $1`

	var res InviteTokenResponse
	err := r.db.QueryRowContext(ctx, query, token).Scan(&res.Email, &res.ExpiresAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInviteNotFound
		}
		return nil, fmt.Errorf("failed to get expired invite: %w", err)
	}

	return &res, nil
}

func (r *postgresRepository) HasPendingInvite(ctx context.Context, email string) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM vendor_invitations
			WHERE email = $1
			AND status = 'pending'
			AND expires_at > NOW()
		)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check pending invite: %w", err)
	}
	return exists, nil
}

func (r *postgresRepository) InvalidateExistingInvite(ctx context.Context, email string) error {
	query := `
		UPDATE vendor_invitations
		SET status = 'expired'
		WHERE email = $1 AND status = 'pending'`

	_, err := r.db.ExecContext(ctx, query, email)
	if err != nil {
		return fmt.Errorf("failed to invalidate invite: %w", err)
	}
	return nil
}

func (r *postgresRepository) MarkInviteUsed(ctx context.Context, token string) error {
	query := `
		UPDATE vendor_invitations
		SET status = 'used'
		WHERE token = $1`

	_, err := r.db.ExecContext(ctx, query, token)
	if err != nil {
		return fmt.Errorf("failed to mark invite used: %w", err)
	}
	return nil
}

func (r *postgresRepository) CreateVendorInvitedRecord(ctx context.Context, email string) error {
	query := `
		INSERT INTO vendors (email, status)
		VALUES ($1, 'invited')
		ON CONFLICT (email) DO NOTHING`

	_, err := r.db.ExecContext(ctx, query, email)
	if err != nil {
		return fmt.Errorf("failed to create vendor invited record for %s: %w", email, err)
	}

	return nil
}