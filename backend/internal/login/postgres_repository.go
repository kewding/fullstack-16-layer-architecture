package login

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

var _ Repository = (*postgresRepository)(nil)

type postgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

type sqlTxWrapper struct {
	tx *sql.Tx
}

func (w *sqlTxWrapper) Commit(ctx context.Context) error {
	return w.tx.Commit()
}

func (w *sqlTxWrapper) Rollback(ctx context.Context) error {
	return w.tx.Rollback()
}

func getTx(tx Tx) (*sql.Tx, error) {
	wrapper, ok := tx.(*sqlTxWrapper)
	if !ok {
		return nil, errors.New("invalid transaction type: expected *sqlTxWrapper")
	}
	return wrapper.tx, nil
}


// checks for account existence and ignores soft-deleted users [5, 6]
func (r *postgresRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check email: %w", err)
	}
	return exists, nil
}

// retrieves credentials and metadata 
func (r *postgresRepository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, email, password_hash, role_id 
		FROM users 
		WHERE email = $1 AND deleted_at IS NULL`
	
	var user User
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID, 
		&user.Email, 
		&user.PasswordHash, 
		&user.RoleID,
	)
	
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("database error fetching user: %w", err)
	}
	return &user, nil
}

// token persistence
func (r *postgresRepository) SaveSession(ctx context.Context, token string, userID string, expiresAt time.Time) error {
	query := `
		INSERT INTO sessions (token, user_id, expires_at) 
		VALUES ($1, $2, $3)`
	
	_, err := r.db.ExecContext(ctx, query, token, userID, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to save session: %w", err)
	}

	return nil
}

// initializes a new SQL transaction
func (r *postgresRepository) BeginTx(ctx context.Context) (Tx, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	return &sqlTxWrapper{tx: tx}, nil
}