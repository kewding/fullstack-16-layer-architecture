package vendorregister

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

// sqlTxWrapper wraps the standard sql.Tx to satisfy the domain Tx interface
type sqlTxWrapper struct {
	tx *sql.Tx
}

func (w *sqlTxWrapper) Commit(ctx context.Context) error {
	return w.tx.Commit()
}

func (w *sqlTxWrapper) Rollback(ctx context.Context) error {
	return w.tx.Rollback()
}

// getTx is a helper function to extract the underlying *sql.Tx safely
func getTx(tx Tx) (*sql.Tx, error) {
	wrapper, ok := tx.(*sqlTxWrapper)
	if !ok {
		return nil, errors.New("invalid transaction type: expected *sqlTxWrapper")
	}
	return wrapper.tx, nil
}

func (r *postgresRepository) BeginTx(ctx context.Context) (Tx, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	return &sqlTxWrapper{tx: tx}, nil
}

func (r *postgresRepository) GetInviteEmailByToken(ctx context.Context, token string) (string, error) {
	query := `
		SELECT email
		FROM vendor_invitations
		WHERE token = $1
		  AND status = 'pending'
		  AND expires_at > NOW()`

	var email string
	err := r.db.QueryRowContext(ctx, query, token).Scan(&email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrInviteInvalid
		}
		return "", fmt.Errorf("failed to validate invite token: %w", err)
	}

	return email, nil
}

func (r *postgresRepository) MarkInviteUsed(ctx context.Context, tx Tx, token string) error {
	sqlTx, err := getTx(tx)
	if err != nil {
		return err
	}

	query := `
		UPDATE vendor_invitations
		SET status = 'used'
		WHERE token = $1`

	_, err = sqlTx.ExecContext(ctx, query, token)
	if err != nil {
		return fmt.Errorf("failed to mark invite as used: %w", err)
	}

	return nil
}

func (r *postgresRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check email: %w", err)
	}
	return exists, nil
}

func (r *postgresRepository) CreateUser(ctx context.Context, tx Tx, email string, hashedPassword string) (string, error) {
	sqlTx, err := getTx(tx)
	if err != nil {
		return "", err
	}

	query := `
		INSERT INTO users (email, password_hash, role_id)
		VALUES ($1, $2, (SELECT id FROM user_roles WHERE slug = 'vendor'))
		RETURNING id`

	var userID string
	err = sqlTx.QueryRowContext(ctx, query, email, hashedPassword).Scan(&userID)
	if err != nil {
		return "", fmt.Errorf("failed to create vendor user: %w", err)
	}

	return userID, nil
}

func (r *postgresRepository) CreateUserInfo(ctx context.Context, tx Tx, userID string, req VendorRegisterRequest) error {
	sqlTx, err := getTx(tx)
	if err != nil {
		return err
	}

	birthDate, err := time.Parse("2006-01-02", req.BirthDate)
	if err != nil {
		return fmt.Errorf("invalid birth date format: %w", err)
	}

	query := `
		INSERT INTO users_info (user_id, first_name, middle_name, last_name, birth_date, contact_no)
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err = sqlTx.ExecContext(ctx, query,
		userID,
		req.FirstName,
		req.MiddleName,
		req.LastName,
		birthDate,
		req.ContactNumber,
	)
	if err != nil {
		return fmt.Errorf("failed to create vendor user info: %w", err)
	}

	return nil
}

func (r *postgresRepository) CreateStall(ctx context.Context, tx Tx, userID string, businessName string) error {
	sqlTx, err := getTx(tx)
	if err != nil {
		return err
	}

	query := `INSERT INTO stalls (user_id, stall_name) VALUES ($1, $2)`
	_, err = sqlTx.ExecContext(ctx, query, userID, businessName)
	if err != nil {
		return fmt.Errorf("failed to create stall: %w", err)
	}

	return nil
}

func (r *postgresRepository) CreateWallet(ctx context.Context, tx Tx, userID string) error {
	sqlTx, err := getTx(tx)
	if err != nil {
		return err
	}

	query := `INSERT INTO wallets (user_id) VALUES ($1)`
	_, err = sqlTx.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to create wallet: %w", err)
	}

	return nil
}

func (r *postgresRepository) CreateVendorRecord(ctx context.Context, tx Tx, userID string, email string) error {
	sqlTx, err := getTx(tx)
	if err != nil {
		return err
	}

	// Update the existing invited row — populate user_id and advance status
	query := `
		UPDATE vendors
		SET user_id = $1,
		    status = 'for_review'
		WHERE email = $2`

	result, err := sqlTx.ExecContext(ctx, query, userID, email)
	if err != nil {
		return fmt.Errorf("failed to update vendor record: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("no vendor record found for email %s", email)
	}

	return nil
}