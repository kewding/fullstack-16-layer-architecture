package vendorsledger

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

// GetLedger returns paginated entries plus the net balance for the vendor.
func (r *postgresRepository) GetLedger(ctx context.Context, vendorID string, page, limit int) (*GetLedgerResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	// Net balance (across all entries, unpaged)
	var netBalance float64
	err := r.db.QueryRowContext(ctx,
		`SELECT COALESCE(SUM(amount * direction), 0) FROM vendors_ledger WHERE vendor_id = $1`,
		vendorID,
	).Scan(&netBalance)
	if err != nil {
		return nil, fmt.Errorf("GetLedger net balance: %w", err)
	}

	// Total count
	var total int
	err = r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM vendors_ledger WHERE vendor_id = $1`,
		vendorID,
	).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("GetLedger count: %w", err)
	}

	// Paginated entries
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			id,
			entry_type,
			amount,
			direction,
			amount * direction AS signed_amount,
			billing_month::TEXT,
			reference_id::TEXT,
			reference_type,
			note,
			created_at
		FROM vendors_ledger
		WHERE vendor_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`,
		vendorID, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("GetLedger query: %w", err)
	}
	defer rows.Close()

	entries := []LedgerEntry{}
	for rows.Next() {
		var e LedgerEntry
		var billingMonth, refID, refType, note sql.NullString
		if err := rows.Scan(
			&e.ID,
			&e.EntryType,
			&e.Amount,
			&e.Direction,
			&e.SignedAmount,
			&billingMonth,
			&refID,
			&refType,
			&note,
			&e.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("GetLedger scan: %w", err)
		}
		if billingMonth.Valid {
			e.BillingMonth = &billingMonth.String
		}
		if refID.Valid {
			e.ReferenceID = &refID.String
		}
		if refType.Valid {
			e.ReferenceType = &refType.String
		}
		if note.Valid {
			e.Note = &note.String
		}
		entries = append(entries, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetLedger rows: %w", err)
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &GetLedgerResponse{
		Data:       entries,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
		NetBalance: netBalance,
	}, nil
}

// InsertEntry inserts a ledger entry and atomically updates the vendor's wallet.balance.
// Uses a transaction to ensure both succeed or both fail.
func (r *postgresRepository) InsertEntry(ctx context.Context, params InsertLedgerEntryParams) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("InsertEntry begin tx: %w", err)
	}
	defer tx.Rollback()

	// Insert ledger row
	_, err = tx.ExecContext(ctx, `
		INSERT INTO vendors_ledger
			(vendor_id, entry_type, amount, direction, billing_month, reference_id, reference_type, note)
		VALUES
			($1, $2::vendors_ledger_entry_type, $3, $4, $5::DATE, $6::UUID, $7, $8)`,
		params.VendorID,
		string(params.EntryType),
		params.Amount,
		params.Direction,
		params.BillingMonth,
		params.ReferenceID,
		params.ReferenceType,
		params.Note,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return ErrAlreadyPosted
		}
		return fmt.Errorf("InsertEntry insert ledger: %w", err)
	}

	// Atomically update the wallet balance for this vendor.
	// wallet.balance must remain >= 0 (DB constraint), so debit will fail if insufficient.
	// We look up the vendor's user_id first.
	var userID string
	err = tx.QueryRowContext(ctx,
		`SELECT user_id FROM vendors WHERE id = $1 AND deleted_at IS NULL`,
		params.VendorID,
	).Scan(&userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrVendorNotFound
		}
		return fmt.Errorf("InsertEntry lookup user_id: %w", err)
	}

	// Update wallet: balance += (amount * direction)
	res, err := tx.ExecContext(ctx, `
		UPDATE wallets
		SET balance = balance + ($1 * $2), updated_at = NOW()
		WHERE user_id = $3`,
		params.Amount, params.Direction, userID,
	)
	if err != nil {
		// The chk_balance_non_negative constraint will produce a check violation (23514)
		// if a debit exceeds the current balance.
		if isCheckViolation(err) {
			return ErrInsufficientBalance
		}
		return fmt.Errorf("InsertEntry update wallet: %w", err)
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		// Vendor has no wallet yet — create one.
		_, err = tx.ExecContext(ctx, `
			INSERT INTO wallets (user_id, balance)
			VALUES ($1, $2 * $3)`,
			userID, params.Amount, params.Direction,
		)
		if err != nil {
			return fmt.Errorf("InsertEntry create wallet: %w", err)
		}
	}

	return tx.Commit()
}

// GetNetBalance returns the vendor's current net ledger balance.
func (r *postgresRepository) GetNetBalance(ctx context.Context, vendorID string) (float64, error) {
	var balance float64
	err := r.db.QueryRowContext(ctx,
		`SELECT COALESCE(SUM(amount * direction), 0) FROM vendors_ledger WHERE vendor_id = $1`,
		vendorID,
	).Scan(&balance)
	if err != nil {
		return 0, fmt.Errorf("GetNetBalance: %w", err)
	}
	return balance, nil
}

// GetAllInBusinessVendors returns vendor_id and user_id for all active vendors.
func (r *postgresRepository) GetAllInBusinessVendors(ctx context.Context) ([]VendorRef, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id FROM vendors WHERE status = 'in_business' AND deleted_at IS NULL AND user_id IS NOT NULL`,
	)
	if err != nil {
		return nil, fmt.Errorf("GetAllInBusinessVendors: %w", err)
	}
	defer rows.Close()

	var vendors []VendorRef
	for rows.Next() {
		var v VendorRef
		if err := rows.Scan(&v.VendorID, &v.UserID); err != nil {
			return nil, fmt.Errorf("GetAllInBusinessVendors scan: %w", err)
		}
		vendors = append(vendors, v)
	}
	return vendors, rows.Err()
}

// GetGrossProfitForMonth sums sales.total_amount for a vendor for the given calendar month.
func (r *postgresRepository) GetGrossProfitForMonth(ctx context.Context, vendorID string, billingMonth string) (float64, error) {
	// billingMonth is YYYY-MM-01; we want the full month window.
	query := `
		SELECT COALESCE(SUM(s.total_amount), 0)
		FROM sales s
		JOIN stalls st ON st.id = s.stall_id
		JOIN vendors v ON v.user_id = st.user_id
		WHERE v.id = $1
		  AND s.created_at >= $2::DATE
		  AND s.created_at <  ($2::DATE + INTERVAL '1 month')`

	var total float64
	err := r.db.QueryRowContext(ctx, query, vendorID, billingMonth).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("GetGrossProfitForMonth: %w", err)
	}
	return total, nil
}

// GetActiveFeeForMonth returns the sum of all 4 fee components active during billingMonth.
// "Active" means the most recent row per fee_type where effective_month <= billingMonth.
func (r *postgresRepository) GetActiveFeeForMonth(ctx context.Context, billingMonth string) (float64, error) {
	query := `
		SELECT COALESCE(SUM(latest.amount), 0)
		FROM (
			SELECT DISTINCT ON (fee_type) amount
			FROM concession_fee_settings
			WHERE effective_month <= $1::DATE
			ORDER BY fee_type, effective_month DESC
		) latest`

	var total float64
	err := r.db.QueryRowContext(ctx, query, billingMonth).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("GetActiveFeeForMonth: %w", err)
	}
	return total, nil
}

// isUniqueViolation checks Postgres error code 23505.
func isUniqueViolation(err error) bool {
	return hasSQLState(err, "23505")
}

// isCheckViolation checks Postgres error code 23514.
func isCheckViolation(err error) bool {
	return hasSQLState(err, "23514")
}

func hasSQLState(err error, state string) bool {
	if err == nil {
		return false
	}
	type pgErr interface{ SQLState() string }
	var pg pgErr
	if errors.As(err, &pg) {
		return pg.SQLState() == state
	}
	return false
}

func (r *postgresRepository) GetVendorIDByUserID(ctx context.Context, userID string) (string, error) {
	var vendorID string
	err := r.db.QueryRowContext(ctx,
		`SELECT id FROM vendors WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
		userID,
	).Scan(&vendorID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrVendorNotFound
		}
		return "", fmt.Errorf("GetVendorIDByUserID: %w", err)
	}
	return vendorID, nil
}