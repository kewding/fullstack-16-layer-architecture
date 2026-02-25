package register

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

// InstitutionalIDExists checks if an ID exists in the lookup table
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

// EmailExists checks for email uniqueness across existing users
func (r *postgresRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`
	var exists bool

	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check email: %w", err)
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

// CreateUser inserts the base user and returns the new auto-incremented primary key
func (r *postgresRepository) CreateUser(ctx context.Context, tx Tx, req RegisterRequest, hashedPassword string, roleSlug string) (string, error) {
    sqlTx, err := getTx(tx)
    if err != nil {
        return "", err
    }

    // We use a subquery to find the role_id based on the slug provided.
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

// CreateUserInfo stores the personal information mapped to the new user ID
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

// CreateUserInstLink resolves the internal Primary Key of the institution and links it
func (r *postgresRepository) CreateUserInstLink(ctx context.Context, tx Tx, userID string, institutionalID string) (string, error) {
	sqlTx, err := getTx(tx)
	if err != nil {
		return "", err
	}

	// Updated query to include RETURNING id, matching the users_inst_id schema
	query := `
		INSERT INTO users_inst_id (user_id, inst_id)
		VALUES ($1, $2)
		RETURNING id`

	var linkID string
	// We use QueryRowContext to scan the returned UUID directly into a string
	err = sqlTx.QueryRowContext(ctx, query, userID, institutionalID).Scan(&linkID)
	if err != nil {
		return "", fmt.Errorf("db error linking institutional ID: %w", err)
	}

	return linkID, nil
}

// CreateUserRFIDLink inserts the RFID row with a NULL tag as required
func (r *postgresRepository) CreateUserRFIDLink(ctx context.Context, tx Tx, userID string, rfidTag string) error {
    sqlTx, err := getTx(tx)
    if err != nil {
        return err
    }

    query := `INSERT INTO users_rfid (user_id, rfid_tag) VALUES ($1, $2)`

    // Ensure empty strings are treated as NULL to satisfy the UNIQUE constraint
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
