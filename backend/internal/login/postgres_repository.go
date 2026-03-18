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

// func getTx(tx Tx) (*sql.Tx, error) {
// 	wrapper, ok := tx.(*sqlTxWrapper)
// 	if !ok {
// 		return nil, errors.New("invalid transaction type: expected *sqlTxWrapper")
// 	}
// 	return wrapper.tx, nil
// }

// checks for account existence and ignores soft-deleted users
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

func (r *postgresRepository) VerifySession(ctx context.Context, token string) (*UserSessionDTO, error) {
	// This query joins the sessions table with the users table to get the role_id
	query := `
        SELECT s.user_id, u.role_id 
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = $1 AND s.expires_at > now() AND u.deleted_at IS NULL`

	var dto UserSessionDTO
	err := r.db.QueryRowContext(ctx, query, token).Scan(&dto.ID, &dto.RoleID)
	if err != nil {
		return nil, err // Returns error if session is expired or non-existent
	}

	return &dto, nil
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

func (r *postgresRepository) RefreshSession(ctx context.Context, token string) error {
	query := `
		UPDATE sessions 
		SET expires_at = NOW() + INTERVAL '3 hours'
		WHERE token = $1 AND expires_at > NOW()`

	_, err := r.db.ExecContext(ctx, query, token)
	if err != nil {
		return fmt.Errorf("failed to refresh session: %w", err)
	}
	return nil
}

func (r *postgresRepository) GetMe(ctx context.Context, token string) (*MeResponse, error) {
	query := `
		SELECT u.id, u.email, u.role_id, ui.first_name
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		JOIN users_info ui ON ui.user_id = u.id
		WHERE s.token = $1
		  AND s.expires_at > NOW()
		  AND u.deleted_at IS NULL
		LIMIT 1`

	var res MeResponse
	err := r.db.QueryRowContext(ctx, query, token).Scan(
		&res.ID,
		&res.Email,
		&res.RoleID,
		&res.FirstName,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSessionNotFound
		}
		return nil, fmt.Errorf("failed to get session user: %w", err)
	}

	return &res, nil
}

func (r *postgresRepository) InvalidateSession(ctx context.Context, token string) error {
	query := `
		UPDATE sessions 
		SET expires_at = NOW() 
		WHERE token = $1`

	_, err := r.db.ExecContext(ctx, query, token)
	if err != nil {
		return fmt.Errorf("failed to invalidate session: %w", err)
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
