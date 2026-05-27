package vendorwithdrawal

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

// ── helpers ───────────────────────────────────────────────────────────────────

func (r *postgresRepository) buildDateFilter(col string, dateStart, dateEnd string, args *[]any, argIdx *int) string {
	var parts []string
	if dateStart != "" {
		parts = append(parts, fmt.Sprintf("%s >= $%d::date", col, *argIdx))
		*args = append(*args, dateStart)
		(*argIdx)++
	}
	if dateEnd != "" {
		parts = append(parts, fmt.Sprintf("%s <= $%d::date + INTERVAL '1 day' - INTERVAL '1 second'", col, *argIdx))
		*args = append(*args, dateEnd)
		(*argIdx)++
	}
	if len(parts) == 0 {
		return "true"
	}
	return strings.Join(parts, " AND ")
}

func (r *postgresRepository) GetVendorByUserID(ctx context.Context, userID string) (string, float64, error) {
	var vendorID string
	var balance float64
	err := r.db.QueryRowContext(ctx, `
		SELECT v.id, COALESCE(w.balance, 0)
		FROM vendors v
		LEFT JOIN wallets w ON w.user_id = v.user_id
		WHERE v.user_id = $1 AND v.deleted_at IS NULL
		LIMIT 1`, userID,
	).Scan(&vendorID, &balance)
	if errors.Is(err, sql.ErrNoRows) {
		return "", 0, ErrVendorNotFound
	}
	if err != nil {
		return "", 0, fmt.Errorf("GetVendorByUserID: %w", err)
	}
	return vendorID, balance, nil
}

func (r *postgresRepository) GetWalletBalance(ctx context.Context, userID string) (float64, error) {
	var balance float64
	err := r.db.QueryRowContext(ctx,
		`SELECT balance FROM wallets WHERE user_id = $1`, userID,
	).Scan(&balance)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, fmt.Errorf("wallet not found for user %s", userID)
	}
	return balance, err
}

func (r *postgresRepository) GetCashierName(ctx context.Context, cashierID string) (string, error) {
	var name string
	err := r.db.QueryRowContext(ctx,
		`SELECT CONCAT(ui.first_name, ' ', ui.last_name)
		 FROM users_info ui WHERE ui.user_id = $1`, cashierID,
	).Scan(&name)
	if errors.Is(err, sql.ErrNoRows) {
		return "", nil
	}
	return name, err
}

func (r *postgresRepository) GetRequestByID(ctx context.Context, requestID string) (*vendorWithdrawalRow, error) {
	var row vendorWithdrawalRow
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, vendor_id, amount, status
		 FROM vendor_withdrawal_requests WHERE id = $1`,
		requestID,
	).Scan(&row.ID, &row.UserID, &row.VendorID, &row.Amount, &row.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrRequestNotFound
	}
	return &row, err
}

// ── vendor ────────────────────────────────────────────────────────────────────

func (r *postgresRepository) HasPendingRequest(ctx context.Context, userID string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM vendor_withdrawal_requests WHERE user_id = $1 AND status = 'pending')`,
		userID,
	).Scan(&exists)
	return exists, err
}

func (r *postgresRepository) SubmitRequest(ctx context.Context, userID string, vendorID string, amount float64) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO vendor_withdrawal_requests (user_id, vendor_id, amount)
		 VALUES ($1, $2, $3) RETURNING id`,
		userID, vendorID, amount,
	).Scan(&id)
	return id, err
}

func (r *postgresRepository) GetPendingRequest(ctx context.Context, userID string) (*PendingVendorWithdrawalResponse, error) {
	var res PendingVendorWithdrawalResponse
	var createdAt time.Time
	err := r.db.QueryRowContext(ctx,
		`SELECT id, amount, status, created_at
		 FROM vendor_withdrawal_requests
		 WHERE user_id = $1 AND status = 'pending'
		 ORDER BY created_at DESC LIMIT 1`,
		userID,
	).Scan(&res.ID, &res.Amount, &res.Status, &createdAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	res.CreatedAt = createdAt.Format(time.RFC3339)
	return &res, nil
}

func (r *postgresRepository) DeletePendingRequest(ctx context.Context, requestID string, userID string) error {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM vendor_withdrawal_requests
		 WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
		requestID, userID,
	)
	if err != nil {
		return fmt.Errorf("DeletePendingRequest: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return ErrNotPending
	}
	return nil
}

func (r *postgresRepository) ListHistory(ctx context.Context, userID string, params VendorWithdrawalHistoryParams) ([]VendorWithdrawalHistoryRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{userID}
	argIdx := 2

	dateFilter := r.buildDateFilter("vwr.created_at", params.DateStart, params.DateEnd, &args, &argIdx)

	base := fmt.Sprintf(`
		FROM vendor_withdrawal_requests vwr
		WHERE vwr.user_id = $1
		  AND vwr.status != 'pending'
		  AND %s`, dateFilter)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListHistory count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT vwr.id,
		       vwr.amount,
		       vwr.status,
		       vwr.cashier_name,
		       vwr.rejection_reason::TEXT,
		       vwr.rejection_comment,
		       vwr.balance_before,
		       vwr.balance_after,
		       vwr.created_at
		%s
		ORDER BY vwr.created_at DESC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListHistory query: %w", err)
	}
	defer rows.Close()

	result := make([]VendorWithdrawalHistoryRow, 0)
	for rows.Next() {
		var row VendorWithdrawalHistoryRow
		var createdAt time.Time
		if err := rows.Scan(
			&row.ID, &row.Amount, &row.Status,
			&row.CashierName,
			&row.RejectionReason, &row.RejectionComment,
			&row.BalanceBefore, &row.BalanceAfter,
			&createdAt,
		); err != nil {
			return nil, 0, fmt.Errorf("ListHistory scan: %w", err)
		}
		row.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, row)
	}
	return result, total, rows.Err()
}

// ── cashier ───────────────────────────────────────────────────────────────────

func (r *postgresRepository) ListPendingRequests(ctx context.Context, params CashierVendorWithdrawalParams) ([]CashierVendorWithdrawalRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{}
	argIdx := 1
	conditions := []string{"vwr.status = 'pending'"}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d OR s.stall_name ILIKE $%d)",
			argIdx, argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	dateFilter := r.buildDateFilter("vwr.created_at", params.DateStart, params.DateEnd, &args, &argIdx)
	if dateFilter != "true" {
		conditions = append(conditions, dateFilter)
	}

	where := "WHERE " + strings.Join(conditions, " AND ")
	base := fmt.Sprintf(`
		FROM vendor_withdrawal_requests vwr
		JOIN users u       ON u.id        = vwr.user_id
		JOIN users_info ui ON ui.user_id  = u.id
		LEFT JOIN stalls s ON s.user_id   = u.id AND s.deleted_at IS NULL
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListPendingRequests count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT vwr.id, vwr.user_id, vwr.vendor_id,
		       CONCAT(ui.first_name, ' ', ui.last_name) AS full_name,
		       COALESCE(s.stall_name, '')               AS stall_name,
		       vwr.amount, vwr.status, vwr.created_at
		%s
		ORDER BY vwr.created_at ASC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListPendingRequests query: %w", err)
	}
	defer rows.Close()

	result := make([]CashierVendorWithdrawalRow, 0)
	for rows.Next() {
		var row CashierVendorWithdrawalRow
		var createdAt time.Time
		if err := rows.Scan(
			&row.ID, &row.UserID, &row.VendorID, &row.FullName,
			&row.StallName, &row.Amount, &row.Status, &createdAt,
		); err != nil {
			return nil, 0, fmt.Errorf("ListPendingRequests scan: %w", err)
		}
		row.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, row)
	}
	return result, total, rows.Err()
}

// CompleteRequest atomically:
//  1. Row-locks and verifies the request is still pending.
//  2. Row-locks and reads the vendor's wallet balance.
//  3. Deducts the wallet balance (fails if insufficient).
//  4. Inserts a vendors_ledger remittance DEBIT entry.
//  5. Updates vendor_withdrawal_requests with status + snapshots + ledger_entry_id.
func (r *postgresRepository) CompleteRequest(ctx context.Context, requestID string, cashierID string, cashierName string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("CompleteRequest begin tx: %w", err)
	}
	defer tx.Rollback()

	// 1. Lock and verify
	var req vendorWithdrawalRow
	if err := tx.QueryRowContext(ctx,
		`SELECT id, user_id, vendor_id, amount, status
		 FROM vendor_withdrawal_requests WHERE id = $1 FOR UPDATE`,
		requestID,
	).Scan(&req.ID, &req.UserID, &req.VendorID, &req.Amount, &req.Status); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrRequestNotFound
		}
		return fmt.Errorf("CompleteRequest lock: %w", err)
	}
	if req.Status != "pending" {
		return ErrNotPending
	}

	// 2. Read and lock wallet
	var balanceBefore float64
	if err := tx.QueryRowContext(ctx,
		`SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE`, req.UserID,
	).Scan(&balanceBefore); err != nil {
		return fmt.Errorf("CompleteRequest read balance: %w", err)
	}
	if balanceBefore < req.Amount {
		return ErrInsufficientBalance
	}
	balanceAfter := balanceBefore - req.Amount

	// 3. Deduct wallet
	res, err := tx.ExecContext(ctx,
		`UPDATE wallets SET balance = balance - $1, updated_at = NOW()
		 WHERE user_id = $2 AND balance - $1 >= 0`,
		req.Amount, req.UserID,
	)
	if err != nil {
		return fmt.Errorf("CompleteRequest deduct wallet: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrInsufficientBalance
	}

	// 4. Insert vendors_ledger remittance DEBIT
	note := fmt.Sprintf("Vendor withdrawal payout approved, amount: %.2f", req.Amount)
	var ledgerEntryID string
	if err := tx.QueryRowContext(ctx, `
		INSERT INTO vendors_ledger
			(vendor_id, entry_type, amount, direction, billing_month, reference_id, reference_type, note)
		VALUES
			($1, 'remittance'::vendors_ledger_entry_type, $2, -1, NULL, $3::UUID, 'vendor_withdrawal_requests', $4)
		RETURNING id`,
		req.VendorID, req.Amount, requestID, note,
	).Scan(&ledgerEntryID); err != nil {
		return fmt.Errorf("CompleteRequest insert vendors_ledger: %w", err)
	}

	// 5. Update request row
	if _, err := tx.ExecContext(ctx, `
		UPDATE vendor_withdrawal_requests
		SET status          = 'completed',
		    cashier_id      = $1,
		    cashier_name    = $2,
		    balance_before  = $3,
		    balance_after   = $4,
		    ledger_entry_id = $5::UUID
		WHERE id = $6`,
		cashierID, cashierName, balanceBefore, balanceAfter, ledgerEntryID, requestID,
	); err != nil {
		return fmt.Errorf("CompleteRequest update request: %w", err)
	}

	return tx.Commit()
}

func (r *postgresRepository) RejectRequest(ctx context.Context, requestID string, cashierID string, cashierName string, reason RejectionReason, comment string) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE vendor_withdrawal_requests
		SET status            = 'rejected',
		    cashier_id        = $1,
		    cashier_name      = $2,
		    rejection_reason  = $3::rejection_reason_type,
		    rejection_comment = NULLIF($4, '')
		WHERE id = $5 AND status = 'pending'`,
		cashierID, cashierName, string(reason), comment, requestID,
	)
	if err != nil {
		return fmt.Errorf("RejectRequest: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return ErrNotPending
	}
	return nil
}

func (r *postgresRepository) ListCompletedRequests(ctx context.Context, params CashierVendorWithdrawalParams) ([]CashierVendorWithdrawalCompletedRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{}
	argIdx := 1
	conditions := []string{"vwr.status = 'completed'"}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d OR s.stall_name ILIKE $%d)",
			argIdx, argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}
	dateFilter := r.buildDateFilter("vwr.created_at", params.DateStart, params.DateEnd, &args, &argIdx)
	if dateFilter != "true" {
		conditions = append(conditions, dateFilter)
	}

	where := "WHERE " + strings.Join(conditions, " AND ")
	base := fmt.Sprintf(`
		FROM vendor_withdrawal_requests vwr
		JOIN users u       ON u.id        = vwr.user_id
		JOIN users_info ui ON ui.user_id  = u.id
		LEFT JOIN stalls s ON s.user_id   = u.id AND s.deleted_at IS NULL
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListCompletedRequests count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT vwr.id,
		       CONCAT(ui.first_name, ' ', ui.last_name),
		       COALESCE(s.stall_name, ''),
		       vwr.amount,
		       COALESCE(vwr.cashier_name, ''),
		       COALESCE(vwr.balance_before, 0),
		       COALESCE(vwr.balance_after, 0),
		       vwr.created_at
		%s
		ORDER BY vwr.created_at DESC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListCompletedRequests query: %w", err)
	}
	defer rows.Close()

	result := make([]CashierVendorWithdrawalCompletedRow, 0)
	for rows.Next() {
		var row CashierVendorWithdrawalCompletedRow
		var createdAt time.Time
		if err := rows.Scan(
			&row.ID, &row.FullName, &row.StallName, &row.Amount,
			&row.CashierName, &row.BalanceBefore, &row.BalanceAfter,
			&createdAt,
		); err != nil {
			return nil, 0, fmt.Errorf("ListCompletedRequests scan: %w", err)
		}
		row.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, row)
	}
	return result, total, rows.Err()
}

func (r *postgresRepository) ListRejectedRequests(ctx context.Context, params CashierVendorWithdrawalParams) ([]CashierVendorWithdrawalRejectedRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{}
	argIdx := 1
	conditions := []string{"vwr.status = 'rejected'"}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d OR s.stall_name ILIKE $%d)",
			argIdx, argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}
	dateFilter := r.buildDateFilter("vwr.created_at", params.DateStart, params.DateEnd, &args, &argIdx)
	if dateFilter != "true" {
		conditions = append(conditions, dateFilter)
	}

	where := "WHERE " + strings.Join(conditions, " AND ")
	base := fmt.Sprintf(`
		FROM vendor_withdrawal_requests vwr
		JOIN users u       ON u.id        = vwr.user_id
		JOIN users_info ui ON ui.user_id  = u.id
		LEFT JOIN stalls s ON s.user_id   = u.id AND s.deleted_at IS NULL
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListRejectedRequests count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT vwr.id,
		       CONCAT(ui.first_name, ' ', ui.last_name),
		       COALESCE(s.stall_name, ''),
		       vwr.amount,
		       COALESCE(vwr.rejection_reason::TEXT, ''),
		       vwr.rejection_comment,
		       COALESCE(vwr.cashier_name, ''),
		       vwr.created_at
		%s
		ORDER BY vwr.created_at DESC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListRejectedRequests query: %w", err)
	}
	defer rows.Close()

	result := make([]CashierVendorWithdrawalRejectedRow, 0)
	for rows.Next() {
		var row CashierVendorWithdrawalRejectedRow
		var createdAt time.Time
		if err := rows.Scan(
			&row.ID, &row.FullName, &row.StallName, &row.Amount,
			&row.RejectionReason, &row.RejectionComment,
			&row.CashierName, &createdAt,
		); err != nil {
			return nil, 0, fmt.Errorf("ListRejectedRequests scan: %w", err)
		}
		row.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, row)
	}
	return result, total, rows.Err()
}

func (r *postgresRepository) GetPendingCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM vendor_withdrawal_requests WHERE status = 'pending'`,
	).Scan(&count)
	return count, err
}

// ── notifications ─────────────────────────────────────────────────────────────

func (r *postgresRepository) CreateUserNotification(ctx context.Context, userID string, notifType string, message string, metadata map[string]interface{}) error {
	var metaJSON []byte
	if metadata != nil {
		var err error
		metaJSON, err = json.Marshal(metadata)
		if err != nil {
			return fmt.Errorf("CreateUserNotification marshal: %w", err)
		}
	}
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO user_notifications (user_id, type, message, metadata)
		 VALUES ($1, $2::user_notification_type, $3, $4)`,
		userID, notifType, message, metaJSON,
	)
	return err
}