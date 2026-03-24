package user

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
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