package concessionfees

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

// GetCurrentAndNextRows returns up to 2 rows per fee_type for the current and next month.
// The [2]*FeeRow array is [0]=current, [1]=next (nil if not set).
func (r *postgresRepository) GetCurrentAndNextRows(ctx context.Context, currentMonth, nextMonth string) (map[FeeType][2]*FeeRow, error) {
	query := `
		SELECT id, fee_type, amount, effective_month::TEXT
		FROM concession_fee_settings
		WHERE effective_month IN ($1::DATE, $2::DATE)
		ORDER BY fee_type, effective_month ASC`

	rows, err := r.db.QueryContext(ctx, query, currentMonth, nextMonth)
	if err != nil {
		return nil, fmt.Errorf("GetCurrentAndNextRows query: %w", err)
	}
	defer rows.Close()

	result := make(map[FeeType][2]*FeeRow)

	for rows.Next() {
		var row FeeRow
		if err := rows.Scan(&row.ID, &row.FeeType, &row.Amount, &row.EffectiveMonth); err != nil {
			return nil, fmt.Errorf("GetCurrentAndNextRows scan: %w", err)
		}

		pair := result[row.FeeType]
		switch row.EffectiveMonth {
		case currentMonth:
			pair[0] = &FeeRow{ID: row.ID, FeeType: row.FeeType, Amount: row.Amount, EffectiveMonth: row.EffectiveMonth}
		case nextMonth:
			pair[1] = &FeeRow{ID: row.ID, FeeType: row.FeeType, Amount: row.Amount, EffectiveMonth: row.EffectiveMonth}
		}
		result[row.FeeType] = pair
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetCurrentAndNextRows rows: %w", err)
	}

	// For any fee_type missing a current-month row, fall back to the most recent prior row.
	for _, ft := range AllFeeTypes {
		pair := result[ft]
		if pair[0] == nil {
			fallback, err := r.mostRecentBefore(ctx, ft, currentMonth)
			if err != nil && !errors.Is(err, sql.ErrNoRows) {
				return nil, err
			}
			if fallback != nil {
				pair[0] = fallback
			}
			result[ft] = pair
		}
	}

	return result, nil
}

// mostRecentBefore returns the most recent row for a fee_type before the given month.
func (r *postgresRepository) mostRecentBefore(ctx context.Context, feeType FeeType, beforeMonth string) (*FeeRow, error) {
	var row FeeRow
	err := r.db.QueryRowContext(ctx, `
		SELECT id, fee_type, amount, effective_month::TEXT
		FROM concession_fee_settings
		WHERE fee_type = $1
		  AND effective_month < $2::DATE
		ORDER BY effective_month DESC
		LIMIT 1`, string(feeType), beforeMonth,
	).Scan(&row.ID, &row.FeeType, &row.Amount, &row.EffectiveMonth)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("mostRecentBefore: %w", err)
	}
	return &row, nil
}

// InsertFeeForNextMonth inserts a new setting row for the next calendar month.
func (r *postgresRepository) InsertFeeForNextMonth(ctx context.Context, feeType FeeType, amount float64, nextMonth string, setByUserID string) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO concession_fee_settings (fee_type, amount, effective_month, set_by)
		VALUES ($1, $2, $3::DATE, $4::UUID)`,
		string(feeType), amount, nextMonth, setByUserID,
	)
	if err != nil {
		// Postgres unique violation code = 23505
		if isUniqueViolation(err) {
			return ErrFeeAlreadySetForNextMonth
		}
		return fmt.Errorf("InsertFeeForNextMonth: %w", err)
	}
	return nil
}

// CarryForwardFees inserts rows for targetMonth for each fee_type that has no row yet.
// It copies the amount from the most recent prior row. Safe to call multiple times (idempotent).
func (r *postgresRepository) CarryForwardFees(ctx context.Context, targetMonth string) error {
	// One INSERT … SELECT per fee_type, skipping if already exists.
	query := `
		INSERT INTO concession_fee_settings (fee_type, amount, effective_month, set_by)
		SELECT
			sub.fee_type,
			sub.amount,
			$1::DATE AS effective_month,
			sub.set_by
		FROM (
			SELECT DISTINCT ON (fee_type)
				fee_type, amount, set_by
			FROM concession_fee_settings
			WHERE effective_month < $1::DATE
			ORDER BY fee_type, effective_month DESC
		) sub
		WHERE NOT EXISTS (
			SELECT 1 FROM concession_fee_settings
			WHERE fee_type = sub.fee_type
			  AND effective_month = $1::DATE
		)`

	_, err := r.db.ExecContext(ctx, query, targetMonth)
	if err != nil {
		return fmt.Errorf("CarryForwardFees: %w", err)
	}
	return nil
}

// GetActiveFeeTotal returns the sum of the 4 latest active fees for the given month.
func (r *postgresRepository) GetActiveFeeTotal(ctx context.Context, month string) (float64, error) {
	query := `
		SELECT COALESCE(SUM(latest.amount), 0)
		FROM (
			SELECT DISTINCT ON (fee_type) amount
			FROM concession_fee_settings
			WHERE effective_month <= $1::DATE
			ORDER BY fee_type, effective_month DESC
		) latest`

	var total float64
	err := r.db.QueryRowContext(ctx, query, month).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("GetActiveFeeTotal: %w", err)
	}
	return total, nil
}

// SyncVendorsConcessionFeeValue updates concession_fee_value for all in_business vendors.
func (r *postgresRepository) SyncVendorsConcessionFeeValue(ctx context.Context, total float64) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE vendors
		SET concession_fee_value = $1, updated_at = NOW()
		WHERE status = 'in_business' AND deleted_at IS NULL`,
		total,
	)
	if err != nil {
		return fmt.Errorf("SyncVendorsConcessionFeeValue: %w", err)
	}
	return nil
}

// isUniqueViolation checks the pq error code for 23505.
func isUniqueViolation(err error) bool {
	// Using string check to avoid importing pq directly here;
	// caller can also check via pq.Error if preferred.
	if err == nil {
		return false
	}
	// pq error code 23505 = unique_violation
	type pgErr interface{ SQLState() string }
	var pg pgErr
	if errors.As(err, &pg) {
		return pg.SQLState() == "23505"
	}
	return false
}

func (r *postgresRepository) GetFeeHistory(ctx context.Context) ([]FeeHistoryRow, error) {
	query := `
		SELECT
			cfs.id::TEXT,
			cfs.fee_type,
			cfs.amount,
			cfs.effective_month::TEXT,
			cfs.set_by::TEXT,
			COALESCE(CONCAT(ui.first_name, ' ', ui.last_name), 'System') AS set_by_name,
			cfs.created_at
		FROM concession_fee_settings cfs
		LEFT JOIN users u ON u.id = cfs.set_by
		LEFT JOIN users_info ui ON ui.user_id = u.id
		ORDER BY cfs.effective_month DESC, cfs.fee_type ASC`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("GetFeeHistory query: %w", err)
	}
	defer rows.Close()

	result := make([]FeeHistoryRow, 0)
	for rows.Next() {
		var row FeeHistoryRow
		var createdAt time.Time
		if err := rows.Scan(
			&row.ID,
			&row.FeeType,
			&row.Amount,
			&row.EffectiveMonth,
			&row.SetByUserID,
			&row.SetByName,
			&createdAt,
		); err != nil {
			return nil, fmt.Errorf("GetFeeHistory scan: %w", err)
		}
		row.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetFeeHistory rows: %w", err)
	}

	return result, nil
}
