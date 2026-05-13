package vendortransactions

import (
	"database/sql"
	"errors"
	"fmt"
	"math"
	"strings"

	_ "github.com/lib/pq"
)

type postgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

// GetVendorIDByUserID resolves vendor_id from the authenticated user_id.
func (r *postgresRepository) GetVendorIDByUserID(userID string) (string, error) {
	var vendorID string
	err := r.db.QueryRow(
		`SELECT id FROM vendors WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
		userID,
	).Scan(&vendorID)
	if errors.Is(err, sql.ErrNoRows) {
		return "", fmt.Errorf("vendor not found for user %s", userID)
	}
	return vendorID, err
}

// List fetches paginated ledger entries for a vendor with optional type/date filters.
// The running balance (new_balance) is computed with a cumulative SUM window
// ordered by created_at ASC so each row reflects the wallet state after that entry.
//
// Supported entry_types exposed to the vendor:
//   gross_profit   → "purchase"   (CREDIT)
//   concession_fee → "fee"        (DEBIT)
//   remittance     → "remittance" (DEBIT)
//
// Type filter maps:
//   TxPurchase   → entry_type = 'gross_profit'
//   TxRemittance → entry_type = 'remittance'
//   TxFee        → entry_type = 'concession_fee'
//   TxAll        → all three
func (r *postgresRepository) List(req ListRequest) ([]VendorTxRow, int, error) {
	args := []interface{}{req.VendorID} // $1 = vendor_id
	argIdx := 2

	// Outer WHERE conditions (applied after the window)
	var outerWhere []string

	// Map frontend TxType to DB entry_type
	switch req.Type {
	case TxPurchase:
		outerWhere = append(outerWhere, fmt.Sprintf("entry_type = $%d", argIdx))
		args = append(args, "gross_profit")
		argIdx++
	case TxRemittance:
		outerWhere = append(outerWhere, fmt.Sprintf("entry_type = $%d", argIdx))
		args = append(args, "remittance")
		argIdx++
	case TxFee:
		outerWhere = append(outerWhere, fmt.Sprintf("entry_type = $%d", argIdx))
		args = append(args, "concession_fee")
		argIdx++
		// TxAll: no filter
	}

	if req.From != nil {
		outerWhere = append(outerWhere, fmt.Sprintf("created_at >= $%d", argIdx))
		args = append(args, *req.From)
		argIdx++
	}

	if req.To != nil {
		outerWhere = append(outerWhere, fmt.Sprintf("created_at < ($%d::date + INTERVAL '1 day')", argIdx))
		args = append(args, *req.To)
		argIdx++
	}

	outerWhereClause := ""
	if len(outerWhere) > 0 {
		outerWhereClause = "WHERE " + strings.Join(outerWhere, " AND ")
	}

	// ── 1. Count ──────────────────────────────────────────────────────────────
	countSQL := fmt.Sprintf(`
		WITH ledger AS (
			SELECT
				id,
				entry_type,
				amount,
				direction,
				amount * direction                                          AS signed_amount,
				SUM(amount * direction) OVER (
					PARTITION BY vendor_id
					ORDER BY created_at ASC
					ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
				)                                                           AS new_balance,
				reference_id::TEXT,
				billing_month::TEXT,
				created_at
			FROM vendors_ledger
			WHERE vendor_id = $1
		)
		SELECT COUNT(*) FROM ledger
		%s
	`, outerWhereClause)

	var total int
	if err := r.db.QueryRow(countSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("vendortransactions: count query: %w", err)
	}

	// ── 2. Data ───────────────────────────────────────────────────────────────
	offset := (req.Page - 1) * req.Limit

	dataSQL := fmt.Sprintf(`
		WITH ledger AS (
			SELECT
				id,
				entry_type,
				amount,
				direction,
				amount * direction                                          AS signed_amount,
				SUM(amount * direction) OVER (
					PARTITION BY vendor_id
					ORDER BY created_at ASC
					ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
				)                                                           AS new_balance,
				reference_id::TEXT,
				billing_month::TEXT,
				created_at
			FROM vendors_ledger
			WHERE vendor_id = $1
		)
		SELECT
			id,
			entry_type,
			amount,
			direction,
			signed_amount,
			new_balance,
			reference_id,
			billing_month,
			created_at
		FROM ledger
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, outerWhereClause, argIdx, argIdx+1)

	args = append(args, req.Limit, offset)

	rows, err := r.db.Query(dataSQL, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("vendortransactions: data query: %w", err)
	}
	defer rows.Close()

	var results []VendorTxRow
	for rows.Next() {
		var row VendorTxRow
		var entryType string
		var refID sql.NullString
		var billingMonth sql.NullString

		if err := rows.Scan(
			&row.ID,
			&entryType,
			&row.Amount,
			&row.Direction,
			&row.SignedAmount,
			&row.NewBalance,
			&refID,
			&billingMonth,
			&row.CreatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("vendortransactions: scan: %w", err)
		}

		row.EntryType = mapEntryType(entryType)
		row.Label = labelFor(row.EntryType)

		if refID.Valid {
			row.ReferenceID = &refID.String
			row.ReferenceNumber = refID.String
		} else {
			// gross_profit has no reference_id — use the ledger entry id itself
			row.ReferenceNumber = row.ID
		}

		if billingMonth.Valid {
			row.BillingMonth = &billingMonth.String
		}

		results = append(results, row)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("vendortransactions: rows error: %w", err)
	}

	totalPages := int(math.Ceil(float64(total) / float64(req.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return results, total, nil
}

// mapEntryType converts the DB enum value to the frontend TxType.
func mapEntryType(et string) TxType {
	switch et {
	case "gross_profit":
		return TxPurchase
	case "remittance":
		return TxRemittance
	case "concession_fee":
		return TxFee
	default:
		return TxType(et)
	}
}

// labelFor returns a human-readable label for each transaction type.
func labelFor(t TxType) string {
	switch t {
	case TxPurchase:
		return "Purchase Revenue"
	case TxRemittance:
		return "Remittance"
	case TxFee:
		return "Concession Fee"
	default:
		return string(t)
	}
}