package register

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

func (r *postgresRepository) InstitutionalIDExists(ctx context.Context, institutionalID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM institutional_id WHERE institution_id = $1)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, institutionalID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check institutional ID: %w", err)
	}
	return exists, nil
}

func (r *postgresRepository) InstitutionalIDTaken(ctx context.Context, instID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users_inst_id WHERE inst_id = $1)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, instID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if institutional ID is taken: %w", err)
	}
	return exists, nil
}

func (r *postgresRepository) AdminIDExists(ctx context.Context, adminID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM admins_institutional_id WHERE admin_id = $1)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, adminID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check admin ID: %w", err)
	}
	return exists, nil
}

func (r *postgresRepository) CashierIDExists(ctx context.Context, cashierID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM cashier_institutional_id WHERE cashier_id = $1)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, cashierID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check cashier ID: %w", err)
	}
	return exists, nil
}

// EmailExists checks for email uniqueness against ACTIVE users only.
// Soft-deleted rows (deleted_at IS NOT NULL) are ignored so that a graduated
// vendor's email is not considered taken during the CheckEmail step.
func (r *postgresRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL)`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check email: %w", err)
	}
	return exists, nil
}

func (r *postgresRepository) BeginTx(ctx context.Context) (Tx, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	return &sqlTxWrapper{tx: tx}, nil
}

func (r *postgresRepository) CreateUser(ctx context.Context, tx Tx, req RegisterRequest, hashedPassword string, roleSlug string) (string, error) {
	sqlTx, err := getTx(tx)
	if err != nil {
		return "", err
	}

	query := `
		INSERT INTO users (email, password_hash, role_id)
		VALUES ($1, $2, (SELECT id FROM user_roles WHERE slug = $3))
		RETURNING id`

	var userID string
	err = sqlTx.QueryRowContext(ctx, query, req.Email, hashedPassword, roleSlug).Scan(&userID)
	if err != nil {
		return "", fmt.Errorf("db error creating user: %w", err)
	}

	return userID, nil
}

func (r *postgresRepository) CreateUserInfo(ctx context.Context, tx Tx, userID string, req RegisterRequest) error {
	sqlTx, err := getTx(tx)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO users_info (user_id, first_name, middle_name, last_name, birth_date, contact_no)
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err = sqlTx.ExecContext(ctx, query, userID, req.FirstName, req.MiddleName, req.LastName, req.BirthDate, req.ContactNumber)
	if err != nil {
		return fmt.Errorf("db error creating user info: %w", err)
	}

	return nil
}

func (r *postgresRepository) CreateUserInstLink(ctx context.Context, tx Tx, userID string, institutionalID string) (string, error) {
	sqlTx, err := getTx(tx)
	if err != nil {
		return "", err
	}

	query := `
		INSERT INTO users_inst_id (user_id, inst_id)
		VALUES ($1, $2)
		RETURNING id`

	var linkID string
	err = sqlTx.QueryRowContext(ctx, query, userID, institutionalID).Scan(&linkID)
	if err != nil {
		return "", fmt.Errorf("db error linking institutional ID: %w", err)
	}

	return linkID, nil
}

func (r *postgresRepository) CreateUserRFIDLink(ctx context.Context, tx Tx, userID string, rfidTag string) error {
	sqlTx, err := getTx(tx)
	if err != nil {
		return err
	}

	query := `INSERT INTO users_rfid (user_id, rfid_tag) VALUES ($1, $2)`

	var tag interface{} = rfidTag
	if rfidTag == "" {
		tag = nil
	}

	_, err = sqlTx.ExecContext(ctx, query, userID, tag)
	if err != nil {
		return fmt.Errorf("db error creating user rfid link: %w", err)
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
		return fmt.Errorf("failed to create wallet for user %s: %w", userID, err)
	}

	return nil
}