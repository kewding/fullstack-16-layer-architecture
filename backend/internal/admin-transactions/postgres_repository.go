package admintransactions

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

func (r *postgresRepository) ListVendorTransactions(ctx context.Context, params ListVendorTxParams) ([]VendorTxRow, int, error) {
	offset := (params.Page - 1) * params.Limit
	search := "%" + params.Search + "%"

	var args []any
	argIdx := 1

	// date filter builder
	buildDate := func(col string) string {
		var parts []string
		if params.DateStart != "" {
			parts = append(parts, fmt.Sprintf("%s >= $%d::date", col, argIdx))
			args = append(args, params.DateStart)
			argIdx++
		}
		if params.DateEnd != "" {
			parts = append(parts, fmt.Sprintf("%s <= $%d::date", col, argIdx))
			args = append(args, params.DateEnd)
			argIdx++
		}
		if len(parts) == 0 {
			return "true"
		}
		return strings.Join(parts, " AND ")
	}

	// Sales branch
	salesDate := buildDate("sa.created_at")
	salesSearchIdx := argIdx
	args = append(args, search)
	argIdx++

	remittanceDate := buildDate("r.created_at")
	remittanceSearchIdx := argIdx
	args = append(args, search)
	argIdx++

	typeFilter := ""
	switch params.Type {
	case VendorTxSale:
		typeFilter = "WHERE type = 'sale'"
	case VendorTxRemittance:
		typeFilter = "WHERE type = 'remittance'"
	}

	union := fmt.Sprintf(`
		SELECT sa.id::TEXT, sa.created_at AS date, 'sale' AS type,
		       CONCAT(ui.first_name, ' ', ui.last_name) AS owner_name,
		       st.stall_name, sa.total_amount AS amount
		FROM sales sa
		JOIN stalls st ON st.id = sa.stall_id
		JOIN users u ON u.id = sa.user_id
		JOIN users_info ui ON ui.user_id = u.id
		WHERE %s AND (st.stall_name ILIKE $%d OR CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d)
		UNION ALL
		SELECT r.id::TEXT, r.created_at AS date, 'remittance' AS type,
		       CONCAT(ui.first_name, ' ', ui.last_name) AS owner_name,
		       COALESCE(st.stall_name, '') AS stall_name, r.amount
		FROM remittances r
		JOIN users u ON u.id = r.user_id
		JOIN users_info ui ON ui.user_id = u.id
		LEFT JOIN stalls st ON st.user_id = r.user_id
		WHERE %s AND (COALESCE(st.stall_name, '') ILIKE $%d OR CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d)`,
		salesDate, salesSearchIdx, salesSearchIdx,
		remittanceDate, remittanceSearchIdx, remittanceSearchIdx,
	)

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM (%s) AS combined %s`, union, typeFilter)
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count vendor transactions: %w", err)
	}

	args = append(args, params.Limit, offset)
	dataQuery := fmt.Sprintf(`
		SELECT id, date, type, owner_name, stall_name, amount
		FROM (%s) AS combined %s
		ORDER BY date DESC, id DESC
		LIMIT $%d OFFSET $%d`, union, typeFilter, argIdx, argIdx+1)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list vendor transactions: %w", err)
	}
	defer rows.Close()

	var results []VendorTxRow
	for rows.Next() {
		var t VendorTxRow
		if err := rows.Scan(&t.ID, &t.Date, &t.Type, &t.OwnerName, &t.StallName, &t.Amount); err != nil {
			return nil, 0, fmt.Errorf("failed to scan vendor transaction: %w", err)
		}
		results = append(results, t)
	}
	if results == nil {
		results = []VendorTxRow{}
	}
	return results, total, nil
}

func (r *postgresRepository) ListCustomerTransactions(ctx context.Context, params ListCustomerTxParams) ([]CustomerTxRow, int, error) {
	offset := (params.Page - 1) * params.Limit
	search := "%" + params.Search + "%"

	args := []any{}
	argIdx := 1

	buildDate := func(col string) string {
		var parts []string
		if params.DateStart != "" {
			parts = append(parts, fmt.Sprintf("%s >= $%d::date", col, argIdx))
			args = append(args, params.DateStart)
			argIdx++
		}
		if params.DateEnd != "" {
			parts = append(parts, fmt.Sprintf("%s <= $%d::date", col, argIdx))
			args = append(args, params.DateEnd)
			argIdx++
		}
		if len(parts) == 0 {
			return "true"
		}
		return strings.Join(parts, " AND ")
	}

	// Always build all branches — filter by type in the outer WHERE to avoid
	// parameter index gaps when a branch is dropped from the UNION.
	topupDate := buildDate("t.created_at")
	topupSearchIdx := argIdx
	args = append(args, search)
	argIdx++

	purchaseDate := buildDate("sa.created_at")
	purchaseSearchIdx := argIdx
	args = append(args, search)
	argIdx++

	refundDate := buildDate("cl.created_at")
	refundSearchIdx := argIdx
	args = append(args, search)
	argIdx++

	withdrawDate := buildDate("cl.created_at")
	withdrawSearchIdx := argIdx
	args = append(args, search)
	argIdx++

	union := fmt.Sprintf(`
		SELECT t.id::TEXT, t.created_at AS date, 'top-up' AS type,
		       CONCAT(ui.first_name, ' ', ui.last_name) AS full_name,
		       t.amount, 'completed' AS status
		FROM top_up_transactions t
		JOIN users u ON u.id = t.user_id
		JOIN users_info ui ON ui.user_id = u.id
		WHERE %s AND CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d
		UNION ALL
		SELECT sa.id::TEXT, sa.created_at AS date, 'purchase' AS type,
		       CONCAT(ui.first_name, ' ', ui.last_name) AS full_name,
		       sa.total_amount AS amount,
		       COALESCE(cl.purchase_status::TEXT, 'completed') AS status
		FROM sales sa
		JOIN users u ON u.id = sa.user_id
		JOIN users_info ui ON ui.user_id = u.id
		LEFT JOIN customers_ledger cl ON cl.reference_id = sa.id AND cl.reference_type = 'purchase'
		WHERE %s AND CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d
		UNION ALL
		SELECT cl.id::TEXT, cl.created_at AS date, 'refund' AS type,
		       CONCAT(ui.first_name, ' ', ui.last_name) AS full_name,
		       cl.credit AS amount, 'refunded' AS status
		FROM customers_ledger cl
		JOIN users u ON u.id = cl.user_id
		JOIN users_info ui ON ui.user_id = u.id
		WHERE cl.reference_type = 'refund' AND %s AND CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d
		UNION ALL
SELECT wr.id::TEXT, wr.created_at AS date, 'withdraw' AS type,
       CONCAT(ui.first_name, ' ', ui.last_name) AS full_name,
       wr.amount, 'completed' AS status
FROM withdrawal_requests wr
JOIN users u ON u.id = wr.user_id
JOIN users_info ui ON ui.user_id = u.id
WHERE wr.status = 'completed' AND %s AND CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d`,
		topupDate, topupSearchIdx,
		purchaseDate, purchaseSearchIdx,
		refundDate, refundSearchIdx,
		withdrawDate, withdrawSearchIdx,
	)

	typeFilter := ""
	switch params.Type {
	case CustomerTxTopUp:
		typeFilter = "WHERE type = 'top-up'"
	case CustomerTxPurchase:
		typeFilter = "WHERE type = 'purchase'"
	case CustomerTxRefund:
		typeFilter = "WHERE type = 'refund'"
	case CustomerTxWithdraw:
		typeFilter = "WHERE type = 'withdraw'"
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM (%s) AS combined %s`, union, typeFilter)
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count customer transactions: %w", err)
	}

	args = append(args, params.Limit, offset)
	dataQuery := fmt.Sprintf(`
		SELECT id, date, type, full_name, amount, status
		FROM (%s) AS combined %s
		ORDER BY date DESC, id DESC
		LIMIT $%d OFFSET $%d`, union, typeFilter, argIdx, argIdx+1)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list customer transactions: %w", err)
	}
	defer rows.Close()

	var results []CustomerTxRow
	for rows.Next() {
		var t CustomerTxRow
		if err := rows.Scan(&t.ID, &t.Date, &t.Type, &t.FullName, &t.Amount, &t.Status); err != nil {
			return nil, 0, fmt.Errorf("failed to scan customer transaction: %w", err)
		}
		results = append(results, t)
	}
	if results == nil {
		results = []CustomerTxRow{}
	}
	return results, total, nil
}

func (r *postgresRepository) GetPurchaseDetail(ctx context.Context, saleID string) (*PurchaseDetail, error) {
	// Get sale header
	var detail PurchaseDetail
	err := r.db.QueryRowContext(ctx, `
		SELECT sa.id::TEXT, st.stall_name, sa.total_amount
		FROM sales sa
		JOIN stalls st ON st.id = sa.stall_id
		WHERE sa.id = $1`, saleID,
	).Scan(&detail.SaleID, &detail.StallName, &detail.Total)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("sale not found")
		}
		return nil, fmt.Errorf("failed to get sale: %w", err)
	}

	// Get items
	rows, err := r.db.QueryContext(ctx, `
		SELECT p.product_name, si.quantity, p.price, si.extended_price
		FROM sales_items si
		JOIN products p ON p.id = si.products_id
		WHERE si.sales_id = $1
		ORDER BY p.product_name`, saleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get sale items: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var item PurchaseItem
		if err := rows.Scan(&item.ProductName, &item.Quantity, &item.Price, &item.Extended); err != nil {
			return nil, fmt.Errorf("failed to scan sale item: %w", err)
		}
		detail.Items = append(detail.Items, item)
	}
	if detail.Items == nil {
		detail.Items = []PurchaseItem{}
	}
	return &detail, nil
}
