package studenttransactions

import (
	"database/sql"
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

// List fetches a paginated, optionally-filtered slice of ledger rows for one
// student. The running balance (new_balance) is computed with a cumulative SUM
// window ordered by created_at ASC so that each row reflects the wallet state
// immediately after that transaction was applied.
//
// Filter combinations supported:
//   - type filter  : "purchase" | "top-up" | "withdraw" | "" (all)
//   - date range   : from / to (both optional, server-side TIMESTAMPTZ comparison)
//   - pagination   : page + limit (offset-based)
func (r *postgresRepository) List(req ListRequest) ([]TransactionRow, int, error) {
	// ── 1. Build the inner CTE that computes the running balance ──────────────
	//
	// The customers_ledger stores debit and credit separately.
	// credit rows increase the wallet (top-up), debit rows decrease it (purchase/withdraw).
	// net = credit - debit for each row.
	// The window SUM gives us the balance right after each event.
	//
	// We filter INSIDE the CTE so the window only runs over rows that belong to
	// this user (important for correctness). Date + type filters are applied in
	// the outer query so that the running balance is always calculated over the
	// full history — only the returned page is filtered.

	args := []interface{}{req.UserID} // $1 = user_id
	argIdx := 2

	// Outer WHERE conditions (applied after the window)
	var outerWhere []string

	if req.Type != TypeAll {
		outerWhere = append(outerWhere, fmt.Sprintf("reference_type = $%d", argIdx))
		args = append(args, string(req.Type))
		argIdx++
	}

	if req.From != nil {
		outerWhere = append(outerWhere, fmt.Sprintf("created_at >= $%d", argIdx))
		args = append(args, *req.From)
		argIdx++
	}

	if req.To != nil {
		// Include the full end day by truncating to the next day boundary
		outerWhere = append(outerWhere, fmt.Sprintf("created_at < ($%d::date + INTERVAL '1 day')", argIdx))
		args = append(args, *req.To)
		argIdx++
	}

	outerWhereClause := ""
	if len(outerWhere) > 0 {
		outerWhereClause = "WHERE " + strings.Join(outerWhere, " AND ")
	}

	// ── 2. Count query (same filters, no pagination) ──────────────────────────
	countSQL := fmt.Sprintf(`
		WITH ledger AS (
			SELECT
				id,
				reference_type,
				CASE
					WHEN credit > 0 THEN credit
					ELSE -debit
				END AS net_amount,
				credit - debit                                         AS net,
				SUM(credit - debit) OVER (
					PARTITION BY user_id
					ORDER BY created_at ASC
					ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
				)                                                      AS new_balance,
				purchase_status,
				created_at
			FROM customers_ledger
			WHERE user_id = $1
		)
		SELECT COUNT(*) FROM ledger
		%s
	`, outerWhereClause)

	var total int
	if err := r.db.QueryRow(countSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("studenttransactions: count query: %w", err)
	}

	// ── 3. Data query (with LIMIT / OFFSET) ───────────────────────────────────
	offset := (req.Page - 1) * req.Limit

	dataSQL := fmt.Sprintf(`
		WITH ledger AS (
			SELECT
				id,
				reference_type,
				CASE
					WHEN credit > 0 THEN credit
					ELSE -debit
				END AS net_amount,
				SUM(credit - debit) OVER (
					PARTITION BY user_id
					ORDER BY created_at ASC
					ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
				) AS new_balance,
				purchase_status,
				created_at
			FROM customers_ledger
			WHERE user_id = $1
		)
		SELECT
			id,
			reference_type,
			net_amount,
			new_balance,
			purchase_status,
			created_at
		FROM ledger
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, outerWhereClause, argIdx, argIdx+1)

	args = append(args, req.Limit, offset)

	rows, err := r.db.Query(dataSQL, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("studenttransactions: data query: %w", err)
	}
	defer rows.Close()

	var results []TransactionRow
	for rows.Next() {
		var row TransactionRow
		var refType string
		var purchaseStatus sql.NullString

		if err := rows.Scan(
			&row.ID,
			&refType,
			&row.Amount,
			&row.NewBalance,
			&purchaseStatus,
			&row.CreatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("studenttransactions: scan: %w", err)
		}

		row.ReferenceType = TransactionType(refType)
		row.Label = labelFor(row.ReferenceType)

		if purchaseStatus.Valid {
			row.PurchaseStatus = purchaseStatus.String
		} else {
			row.PurchaseStatus = "completed"
		}

		results = append(results, row)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("studenttransactions: rows error: %w", err)
	}

	totalPages := int(math.Ceil(float64(total) / float64(req.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return results, total, nil
}

// labelFor maps a transaction_type ENUM value to the human-readable string
// shown in the frontend transaction card.
func labelFor(t TransactionType) string {
	switch t {
	case TypeTopUp:
		return "Balance Top-up"
	case TypePurchase:
		return "Purchase"
	case TypeWithdraw:
		return "Withdrawal"
	default:
		return string(t)
	}
}