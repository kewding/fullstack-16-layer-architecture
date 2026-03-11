package rfidtagging


import (
	"context"
	"database/sql"
	"errors"
	"fmt"
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

func (r *postgresRepository) UserUuidExists(ctx context.Context, uuid string) (bool, error) {
	
	query := `SELECT EXISTS(SELECT 1 FROM users_rfid WHERE user_id = $1)`
	var exists bool

	err := r.db.QueryRowContext(ctx, query, uuid).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check uuid: %w", err)
	}

	return exists, nil
}

func (r *postgresRepository) UserRfidExists(ctx context.Context, userID string) (bool, error) {
    // check for a row where the user_id matches AND the rfid_tag is NOT NULL
    query := `
        SELECT EXISTS (
            SELECT 1 
            FROM users_rfid 
            WHERE user_id = $1 AND rfid_tag IS NOT NULL
        )`
    
    var exists bool
    err := r.db.QueryRowContext(ctx, query, userID).Scan(&exists)
    if err != nil {
        return false, fmt.Errorf("failed to check rfid status for user %s: %w", userID, err)
    }
    
    return exists, nil
}

func (r *postgresRepository) RfidTagTaken(ctx context.Context, rfid string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users_rfid WHERE rfid_tag = $1)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, rfid).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if rfid tag is taken: %w", err)
	}
	return exists, nil
}

// BeginTx initializes a new SQL transaction
func (r *postgresRepository) BeginTx(ctx context.Context) (Tx, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	return &sqlTxWrapper{tx: tx}, nil
}

func (r *postgresRepository) LinkUserRfid(ctx context.Context, tx Tx, uuid string, rfid string) (string, error) {
    sqlTx, err := getTx(tx)
    if err != nil {
        return "", err
    }

    query := `
        UPDATE users_rfid SET rfid_tag = $2 WHERE user_id = $1 RETURNING user_id`

    var userID string
    
    err = sqlTx.QueryRowContext(ctx, query, uuid, rfid).Scan(&userID)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return "", fmt.Errorf("no user found with uuid: %s", uuid)
        }
        return "", fmt.Errorf("db error updating rfid: %w", err)
    }

    return userID, nil
}