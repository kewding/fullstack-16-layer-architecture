package user

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

func (r *postgresRepository) GetUserByID(ctx context.Context, userID string) (*GetUserResponse, error) {
	query := `
		SELECT u.id, ui.first_name, ui.middle_name, ui.last_name
		FROM users u
		JOIN users_info ui ON ui.user_id = u.id
		WHERE u.id = $1 AND u.deleted_at IS NULL
		LIMIT 1`

	var res GetUserResponse
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&res.UserID,
		&res.FirstName,
		&res.MiddleName,
		&res.LastName,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user %s: %w", userID, err)
	}

	return &res, nil
}

func (r *postgresRepository) GetWallet(ctx context.Context, userID string) (*WalletResponse, error) {
	query := `
		SELECT 
			w.balance,
			t.amount,
			t.created_at
		FROM wallets w
		LEFT JOIN LATERAL (
			SELECT amount, created_at
			FROM top_up_transactions
			WHERE user_id = $1
			ORDER BY created_at DESC
			LIMIT 1
		) t ON true
		WHERE w.user_id = $1`

	var res WalletResponse
	var lastAmount *float64
	var lastDate *string

	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&res.Balance,
		&lastAmount,
		&lastDate,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrWalletNotFound
		}
		return nil, fmt.Errorf("failed to get wallet for user %s: %w", userID, err)
	}

	res.LastTopupAmount = lastAmount
	res.LastTopupDate = lastDate

	return &res, nil
}

func (r *postgresRepository) GetAdminInfo(ctx context.Context, userID string) (*AdminInfoResponse, error) {
	query := `
		SELECT ui.first_name, ui.middle_name, ui.last_name,
		       ui.birth_date, ui.contact_no
		FROM users_info ui
		WHERE ui.user_id = $1
		LIMIT 1`

	var res AdminInfoResponse
	var birthDate time.Time
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&res.FirstName,
		&res.MiddleName,
		&res.LastName,
		&birthDate,
		&res.ContactNumber,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get admin info: %w", err)
	}

	res.BirthDate = birthDate.Format("2006-01-02")
	return &res, nil
}

func (r *postgresRepository) UpdateAdminInfo(ctx context.Context, userID string, req UpdateAdminInfoRequest) error {
	birthDate, err := time.Parse("2006-01-02", req.BirthDate)
	if err != nil {
		return fmt.Errorf("invalid birth date format: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		UPDATE users_info
		SET first_name = $1, middle_name = $2, last_name = $3,
		    birth_date = $4, contact_no = $5
		WHERE user_id = $6`,
		req.FirstName, req.MiddleName, req.LastName,
		birthDate, req.ContactNumber, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to update admin info: %w", err)
	}

	return nil
}
