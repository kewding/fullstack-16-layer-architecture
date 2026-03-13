package topup

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/shopspring/decimal"
)

// postgresRepository implements the Repository interface
type postgresRepository struct {
	db *sql.DB
}

// Compile-time check to ensure postgresRepository implements Repository
var _ Repository = (*postgresRepository)(nil)

// NewPostgresRepository acts as the constructor
func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

// sqlTxWrapper wraps the standard sql.Tx to satisfy the domain Tx interface
type sqlTxWrapper struct {
	tx *sql.Tx
}

func (w *sqlTxWrapper) Commit(ctx context.Context) error {
	// sql.Tx Commit doesn't natively take a context, but we fulfill the interface
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

func (r *postgresRepository) RfidExists(ctx context.Context, rfid string) (bool, string, error) {
	// check for a row where the user_id matches AND the rfid_tag is NOT NULL
	query := `
        SELECT user_id 
        FROM users_rfid
        WHERE rfid_tag = $1 AND user_id IS NOT NULL
        LIMIT 1`

	var userID string
	err := r.db.QueryRowContext(ctx, query, rfid).Scan(&userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, "", nil // RFID not found — not an error
		}
		return false, "", fmt.Errorf("failed to check rfid %s: %w", rfid, err)
	}

	return true, userID, nil
}

// BeginTx initializes a new SQL transaction
func (r *postgresRepository) BeginTx(ctx context.Context) (Tx, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	return &sqlTxWrapper{tx: tx}, nil
}

// postgres_repository.go
func (r *postgresRepository) CreditTopupAmount(ctx context.Context, tx Tx, userID string, amount decimal.Decimal) (string, error) {
	sqlTx, err := getTx(tx)
	if err != nil {
		return "", err
	}

	query := `
        INSERT INTO top_up_transactions (user_id, amount) 
        VALUES ($1, $2)
        RETURNING id` // adjust "id" to match your actual PK column name

	var transactionID string
	err = sqlTx.QueryRowContext(ctx, query, userID, amount).Scan(&transactionID)
	if err != nil {
		return "", fmt.Errorf("failed to insert top-up for user %s: %w", userID, err)
	}

	return transactionID, nil
}
