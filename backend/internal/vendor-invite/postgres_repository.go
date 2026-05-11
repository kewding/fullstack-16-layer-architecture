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

func (r *postgresRepository) CreateInvite(ctx context.Context, token string, email string, ownerName string, invitedBy string) error {
	query := `
		INSERT INTO vendor_invitations (token, email, owner_name, invited_by, expires_at)
		VALUES ($1, $2, $3, $4, $5)`

	expiresAt := time.Now().Add(72 * time.Hour)
	_, err := r.db.ExecContext(ctx, query, token, email, ownerName, invitedBy, expiresAt)
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
			AND deleted_at IS NULL
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

// CreateVendorInvitedRecord upserts the vendors row for the invited email.
//
// Two cases handled by one query:
//
//  1. Brand-new invite — no vendors row exists → INSERT a fresh 'invited' row.
//
//  2. Re-invite of a graduated vendor — the old vendors row exists but has
//     deleted_at IS NOT NULL (soft-deleted during graduation).
//     The ON CONFLICT clause fires only when deleted_at IS NOT NULL, which
//     reactivates the row: clears deleted_at, resets status to 'invited',
//     clears the old user_id (the old users row is soft-deleted, not hard-deleted),
//     and updates owner_name in case it changed.
//
// NOTE: this relies on the partial unique index
//
//	CREATE UNIQUE INDEX uq_vendors_email_active ON vendors(email) WHERE deleted_at IS NULL
//
// created by migration__vendors_email_partial_unique.sql.
// A hard UNIQUE(email) constraint must have been dropped before this runs.
func (r *postgresRepository) CreateVendorInvitedRecord(ctx context.Context, email string, ownerName string) error {
	query := `
		INSERT INTO vendors (email, owner_name, status)
		VALUES ($1, $2, 'invited')
		ON CONFLICT (email) WHERE deleted_at IS NOT NULL
		DO UPDATE SET
			owner_name  = EXCLUDED.owner_name,
			status      = 'invited',
			user_id     = NULL,
			deleted_at  = NULL,
			updated_at  = NOW()`

	_, err := r.db.ExecContext(ctx, query, email, ownerName)
	if err != nil {
		return fmt.Errorf("failed to create vendor invited record: %w", err)
	}
	return nil
}

func (r *postgresRepository) GetVendorByID(ctx context.Context, vendorID string) (*InviteTokenResponse, error) {
	query := `
		SELECT vi.email, vi.expires_at, vi.owner_name, v.status
		FROM vendor_invitations vi
		JOIN vendors v ON v.email = vi.email
		WHERE v.id = $1
		AND v.deleted_at IS NULL
		AND vi.deleted_at IS NULL
		LIMIT 1`

	var res InviteTokenResponse
	var status string
	err := r.db.QueryRowContext(ctx, query, vendorID).Scan(
		&res.Email,
		&res.ExpiresAt,
		&res.OwnerName,
		&status,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInviteNotFound
		}
		return nil, fmt.Errorf("failed to get vendor: %w", err)
	}

	if status != "invited" && status != "for_review" {
		return nil, ErrCannotRevoke
	}

	return &res, nil
}

func (r *postgresRepository) RevokeVendor(ctx context.Context, vendorID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	var email string
	var userID sql.NullString
	err = tx.QueryRowContext(ctx,
		`SELECT email, user_id FROM vendors WHERE id = $1`,
		vendorID,
	).Scan(&email, &userID)
	if err != nil {
		return fmt.Errorf("failed to find vendor data: %w", err)
	}

	// Soft-delete the vendor invitation row
	_, err = tx.ExecContext(ctx,
		`UPDATE vendor_invitations SET deleted_at = NOW() WHERE email = $1 AND deleted_at IS NULL`,
		email,
	)
	if err != nil {
		return fmt.Errorf("failed to soft delete vendor invitations: %w", err)
	}

	// Soft-delete the vendor record
	_, err = tx.ExecContext(ctx,
		`UPDATE vendors SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
		vendorID,
	)
	if err != nil {
		return fmt.Errorf("failed to soft delete vendor: %w", err)
	}

	// Soft-delete the user so the email is freed for re-registration.
	// EmailExists checks deleted_at IS NULL, so a soft-deleted row does not
	// block re-registration. For 'invited' vendors user_id is NULL (they haven't
	// registered yet), so we only act when userID is present.
	if userID.Valid {
		_, err = tx.ExecContext(ctx,
			`UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
			userID.String,
		)
		if err != nil {
			return fmt.Errorf("failed to soft-delete user: %w", err)
		}
	}

	return tx.Commit()
}

// IsEmailRegistered returns true only if an ACTIVE (non-deleted) users row
// exists for this email. Graduated vendors have deleted_at set, so they
// return false and can be re-invited.
func (r *postgresRepository) IsEmailRegistered(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check registered email: %w", err)
	}
	return exists, nil
}

func (r *postgresRepository) HasAnyInviteRecord(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM vendor_invitations WHERE email = $1)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check invite record: %w", err)
	}
	return exists, nil
}