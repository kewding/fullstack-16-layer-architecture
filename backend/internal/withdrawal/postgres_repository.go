package withdrawal

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

// ── user ──────────────────────────────────────────────────────────────────────

func (r *postgresRepository) HasPendingRequest(ctx context.Context, userID string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM withdrawal_requests WHERE user_id = $1 AND status = 'pending')`,
		userID,
	).Scan(&exists)
	return exists, err
}

func (r *postgresRepository) SubmitRequest(ctx context.Context, userID string, amount float64) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO withdrawal_requests (user_id, amount) VALUES ($1, $2) RETURNING id`,
		userID, amount,
	).Scan(&id)
	return id, err
}

func (r *postgresRepository) GetPendingRequest(ctx context.Context, userID string) (*PendingWithdrawalResponse, error) {
	var res PendingWithdrawalResponse
	var createdAt time.Time
	err := r.db.QueryRowContext(ctx,
		`SELECT id, amount, status, created_at
		 FROM withdrawal_requests
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
		`DELETE FROM withdrawal_requests WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
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

func (r *postgresRepository) ListHistory(ctx context.Context, userID string, params WithdrawalHistoryParams) ([]WithdrawalHistoryRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{userID}
	argIdx := 2

	dateFilter := r.buildDateFilter("wr.created_at", params.DateStart, params.DateEnd, &args, &argIdx)

	base := fmt.Sprintf(`
		FROM withdrawal_requests wr
		WHERE wr.user_id = $1
		  AND wr.status != 'pending'
		  AND %s`, dateFilter)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListHistory count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT wr.id,
		       wr.amount,
		       wr.status,
		       wr.cashier_name,
		       wr.rejection_reason::TEXT,
		       wr.rejection_comment,
		       wr.balance_before,
		       wr.balance_after,
		       wr.created_at
		%s
		ORDER BY wr.created_at DESC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListHistory query: %w", err)
	}
	defer rows.Close()

	result := make([]WithdrawalHistoryRow, 0)
	for rows.Next() {
		var row WithdrawalHistoryRow
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

func (r *postgresRepository) GetRequestByID(ctx context.Context, requestID string) (*withdrawalRequestRow, error) {
	var row withdrawalRequestRow
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, amount, status FROM withdrawal_requests WHERE id = $1`,
		requestID,
	).Scan(&row.ID, &row.UserID, &row.Amount, &row.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrRequestNotFound
	}
	return &row, err
}

func (r *postgresRepository) ListPendingRequests(ctx context.Context, params CashierWithdrawalParams) ([]CashierWithdrawalRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{}
	argIdx := 1
	conditions := []string{"wr.status = 'pending'"}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d", argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	dateFilter := r.buildDateFilter("wr.created_at", params.DateStart, params.DateEnd, &args, &argIdx)
	if dateFilter != "true" {
		conditions = append(conditions, dateFilter)
	}

	where := "WHERE " + strings.Join(conditions, " AND ")
	base := fmt.Sprintf(`
		FROM withdrawal_requests wr
		JOIN users u ON u.id = wr.user_id
		JOIN users_info ui ON ui.user_id = u.id
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListPendingRequests count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT wr.id, wr.user_id,
		       CONCAT(ui.first_name, ' ', ui.last_name) AS full_name,
		       wr.amount, wr.status, wr.created_at
		%s
		ORDER BY wr.created_at ASC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListPendingRequests query: %w", err)
	}
	defer rows.Close()

	result := make([]CashierWithdrawalRow, 0)
	for rows.Next() {
		var row CashierWithdrawalRow
		var createdAt time.Time
		if err := rows.Scan(&row.ID, &row.UserID, &row.FullName, &row.Amount, &row.Status, &createdAt); err != nil {
			return nil, 0, fmt.Errorf("ListPendingRequests scan: %w", err)
		}
		row.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, row)
	}
	return result, total, rows.Err()
}

func (r *postgresRepository) CompleteRequest(ctx context.Context, requestID string, cashierID string, cashierName string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("CompleteRequest begin tx: %w", err)
	}
	defer tx.Rollback()

	// 1. Lock and verify the request is still pending
	var req withdrawalRequestRow
	err = tx.QueryRowContext(ctx,
		`SELECT id, user_id, amount, status FROM withdrawal_requests WHERE id = $1 FOR UPDATE`,
		requestID,
	).Scan(&req.ID, &req.UserID, &req.Amount, &req.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrRequestNotFound
	}
	if err != nil {
		return fmt.Errorf("CompleteRequest lock: %w", err)
	}
	if req.Status != "pending" {
		return ErrNotPending
	}

	// 2. Read and lock current wallet balance
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

	// 3. Deduct wallet balance
	result, err := tx.ExecContext(ctx,
		`UPDATE wallets SET balance = balance - $1 WHERE user_id = $2 AND balance - $1 >= 0`,
		req.Amount, req.UserID,
	)
	if err != nil {
		return fmt.Errorf("CompleteRequest deduct wallet: %w", err)
	}
	if n, _ := result.RowsAffected(); n == 0 {
		return ErrInsufficientBalance
	}

	// 4. Insert customers_ledger debit row (reference_type = 'withdraw')
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO customers_ledger (user_id, debit, reference_id, reference_type)
		 VALUES ($1, $2, $3, 'withdraw')`,
		req.UserID, req.Amount, requestID,
	); err != nil {
		return fmt.Errorf("CompleteRequest insert ledger: %w", err)
	}

	// 5. Mark the withdrawal request as completed with snapshot balances
	if _, err := tx.ExecContext(ctx,
		`UPDATE withdrawal_requests
		 SET status = 'completed',
		     cashier_id = $1,
		     cashier_name = $2,
		     balance_before = $3,
		     balance_after = $4
		 WHERE id = $5`,
		cashierID, cashierName, balanceBefore, balanceAfter, requestID,
	); err != nil {
		return fmt.Errorf("CompleteRequest update request: %w", err)
	}

	return tx.Commit()
}

func (r *postgresRepository) RejectRequest(ctx context.Context, requestID string, cashierID string, cashierName string, reason RejectionReason, comment string) error {
	result, err := r.db.ExecContext(ctx,
		`UPDATE withdrawal_requests
		 SET status = 'rejected',
		     cashier_id = $1,
		     cashier_name = $2,
		     rejection_reason = $3::rejection_reason_type,
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

func (r *postgresRepository) ListCompletedRequests(ctx context.Context, params CashierWithdrawalParams) ([]CashierWithdrawalCompletedRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{}
	argIdx := 1
	conditions := []string{"wr.status = 'completed'"}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d", argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}
	dateFilter := r.buildDateFilter("wr.created_at", params.DateStart, params.DateEnd, &args, &argIdx)
	if dateFilter != "true" {
		conditions = append(conditions, dateFilter)
	}

	where := "WHERE " + strings.Join(conditions, " AND ")
	base := fmt.Sprintf(`
		FROM withdrawal_requests wr
		JOIN users u ON u.id = wr.user_id
		JOIN users_info ui ON ui.user_id = u.id
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListCompletedRequests count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT wr.id,
		       CONCAT(ui.first_name, ' ', ui.last_name),
		       wr.amount,
		       COALESCE(wr.cashier_name, ''),
		       COALESCE(wr.balance_before, 0),
		       COALESCE(wr.balance_after, 0),
		       wr.created_at
		%s
		ORDER BY wr.created_at DESC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListCompletedRequests query: %w", err)
	}
	defer rows.Close()

	result := make([]CashierWithdrawalCompletedRow, 0)
	for rows.Next() {
		var row CashierWithdrawalCompletedRow
		var createdAt time.Time
		if err := rows.Scan(
			&row.ID, &row.FullName, &row.Amount,
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

func (r *postgresRepository) ListRejectedRequests(ctx context.Context, params CashierWithdrawalParams) ([]CashierWithdrawalRejectedRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{}
	argIdx := 1
	conditions := []string{"wr.status = 'rejected'"}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d", argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}
	dateFilter := r.buildDateFilter("wr.created_at", params.DateStart, params.DateEnd, &args, &argIdx)
	if dateFilter != "true" {
		conditions = append(conditions, dateFilter)
	}

	where := "WHERE " + strings.Join(conditions, " AND ")
	base := fmt.Sprintf(`
		FROM withdrawal_requests wr
		JOIN users u ON u.id = wr.user_id
		JOIN users_info ui ON ui.user_id = u.id
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListRejectedRequests count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT wr.id,
		       CONCAT(ui.first_name, ' ', ui.last_name),
		       wr.amount,
		       COALESCE(wr.rejection_reason::TEXT, ''),
		       wr.rejection_comment,
		       COALESCE(wr.cashier_name, ''),
		       wr.created_at
		%s
		ORDER BY wr.created_at DESC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListRejectedRequests query: %w", err)
	}
	defer rows.Close()

	result := make([]CashierWithdrawalRejectedRow, 0)
	for rows.Next() {
		var row CashierWithdrawalRejectedRow
		var createdAt time.Time
		if err := rows.Scan(
			&row.ID, &row.FullName, &row.Amount,
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
		`SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending'`,
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