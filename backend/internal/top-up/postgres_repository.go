package topup

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/shopspring/decimal"
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

func (r *postgresRepository) RfidExists(ctx context.Context, rfid string) (string, error) {
	query := `
        SELECT user_id 
        FROM users_rfid
        WHERE rfid_tag = $1 AND user_id IS NOT NULL
        LIMIT 1`

	var userID string
	err := r.db.QueryRowContext(ctx, query, rfid).Scan(&userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrRfidUnregistered
		}
		return "", fmt.Errorf("failed to check rfid %s: %w", rfid, err)
	}

	return userID, nil
}

// BeginTx initializes a new SQL transaction
func (r *postgresRepository) BeginTx(ctx context.Context) (Tx, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	return &sqlTxWrapper{tx: tx}, nil
}

func (r *postgresRepository) CreditTopupAmount(ctx context.Context, tx Tx, userID string, amount decimal.Decimal) (string, error) {
	sqlTx, err := getTx(tx)
	if err != nil {
		return "", err
	}

	query := `
        INSERT INTO top_up_transactions (user_id, amount) 
        VALUES ($1, $2)
        RETURNING id`

	var transactionID string
	err = sqlTx.QueryRowContext(ctx, query, userID, amount).Scan(&transactionID)
	if err != nil {
		return "", fmt.Errorf("failed to insert top-up for user %s: %w", userID, err)
	}

	return transactionID, nil
}

func (r *postgresRepository) LedgerRecordsCredit(ctx context.Context, tx Tx, userID string, amount decimal.Decimal, transactionID string, transactionType string) (string, error) {
	sqlTx, err := getTx(tx)
	if err != nil {
		return "", err
	}

	query := `
        INSERT INTO customers_ledger (user_id, debit, reference_id, reference_type) 
        VALUES ($1, $2, $3, $4)
        RETURNING id`

	var ledgerID string
	err = sqlTx.QueryRowContext(ctx, query, userID, amount, transactionID, transactionType).Scan(&ledgerID)
	if err != nil {
		return "", fmt.Errorf("failed to insert ledger record for user %s: %w", userID, err)
	}

	return ledgerID, nil
}

func (r *postgresRepository) UpdateWalletBalance(ctx context.Context, tx Tx, userID string, amount decimal.Decimal) error {
	sqlTx, err := getTx(tx)
	if err != nil {
		return err
	}

	query := `
		UPDATE wallets
		SET balance = balance + $1
		WHERE user_id = $2 AND balance + $1 >= 0
		RETURNING id`

	var id string
	err = sqlTx.QueryRowContext(ctx, query, amount, userID).Scan(&id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrInsufficientBalance
		}
		return fmt.Errorf("failed to update wallet for user %s: %w", userID, err)
	}

	return nil
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

// ── user ──────────────────────────────────────────────────────────────────────

func (r *postgresRepository) HasPendingRequest(ctx context.Context, userID string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM top_up_requests WHERE user_id = $1 AND status = 'pending')`,
		userID,
	).Scan(&exists)
	return exists, err
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

func (r *postgresRepository) GetUserRoleID(ctx context.Context, userID string) (int, error) {
	var roleID int
	err := r.db.QueryRowContext(ctx,
		`SELECT role_id FROM users WHERE id = $1 AND deleted_at IS NULL`, userID,
	).Scan(&roleID)
	return roleID, err
}

func (r *postgresRepository) SubmitRequest(ctx context.Context, userID string, amount float64) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO top_up_requests (user_id, amount) VALUES ($1, $2) RETURNING id`,
		userID, amount,
	).Scan(&id)
	return id, err
}

func (r *postgresRepository) GetPendingRequest(ctx context.Context, userID string) (*PendingRequestResponse, error) {
	var res PendingRequestResponse
	var createdAt time.Time
	err := r.db.QueryRowContext(ctx,
		`SELECT id, amount, status, created_at
		 FROM top_up_requests
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

func (r *postgresRepository) CancelRequest(ctx context.Context, requestID string, userID string) error {
	result, err := r.db.ExecContext(ctx,
		`UPDATE top_up_requests
		 SET status = 'cancelled'
		 WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
		requestID, userID,
	)
	if err != nil {
		return fmt.Errorf("CancelRequest: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return ErrNotPending
	}
	return nil
}

func (r *postgresRepository) ListTopUpHistory(ctx context.Context, userID string, params TopUpHistoryParams) ([]TopUpHistoryRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{userID}
	argIdx := 2

	dateFilter := r.buildDateFilter("r.created_at", params.DateStart, params.DateEnd, &args, &argIdx)

	base := fmt.Sprintf(`
		FROM top_up_requests r
		LEFT JOIN users cu ON cu.id = r.cashier_id
		LEFT JOIN users_info ci ON ci.user_id = cu.id
		WHERE r.user_id = $1
		  AND r.status != 'pending'
		  AND %s`, dateFilter)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListTopUpHistory count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT r.id, r.amount, r.status,
		       CASE WHEN ci.first_name IS NOT NULL
		            THEN CONCAT(ci.first_name, ' ', ci.last_name)
		            ELSE NULL END AS cashier_name,
		       r.rejection_reason::TEXT,
		       r.rejection_comment,
		       r.balance_before,
		       r.balance_after,
		       r.created_at
		%s
		ORDER BY r.created_at DESC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListTopUpHistory query: %w", err)
	}
	defer rows.Close()

	result := make([]TopUpHistoryRow, 0)
	for rows.Next() {
		var row TopUpHistoryRow
		var createdAt time.Time
		if err := rows.Scan(
			&row.ID, &row.Amount, &row.Status,
			&row.CashierName,
			&row.RejectionReason, &row.RejectionComment,
			&row.BalanceBefore, &row.BalanceAfter,
			&createdAt,
		); err != nil {
			return nil, 0, fmt.Errorf("ListTopUpHistory scan: %w", err)
		}
		row.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, row)
	}
	return result, total, rows.Err()
}

// ── cashier ───────────────────────────────────────────────────────────────────

func (r *postgresRepository) ListPendingRequests(ctx context.Context, params CashierListParams) ([]CashierRequestRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{}
	argIdx := 1

	conditions := []string{"r.status = 'pending'"}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d", argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	dateFilter := r.buildDateFilter("r.created_at", params.DateStart, params.DateEnd, &args, &argIdx)
	if dateFilter != "true" {
		conditions = append(conditions, dateFilter)
	}

	where := "WHERE " + strings.Join(conditions, " AND ")

	base := fmt.Sprintf(`
		FROM top_up_requests r
		JOIN users u ON u.id = r.user_id
		JOIN users_info ui ON ui.user_id = u.id
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListPendingRequests count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT r.id, r.user_id,
		       CONCAT(ui.first_name, ' ', ui.last_name) AS full_name,
		       r.amount, r.status, r.created_at
		%s
		ORDER BY r.created_at ASC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListPendingRequests query: %w", err)
	}
	defer rows.Close()

	result := make([]CashierRequestRow, 0)
	for rows.Next() {
		var row CashierRequestRow
		var createdAt time.Time
		if err := rows.Scan(&row.ID, &row.UserID, &row.FullName, &row.Amount, &row.Status, &createdAt); err != nil {
			return nil, 0, fmt.Errorf("ListPendingRequests scan: %w", err)
		}
		row.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, row)
	}
	return result, total, rows.Err()
}

func (r *postgresRepository) GetUserDetailForCashier(ctx context.Context, userID string) (*UserDetailForCashier, error) {
	var detail UserDetailForCashier
	err := r.db.QueryRowContext(ctx, `
		SELECT u.id,
		       CONCAT(ui.first_name, ' ', ui.last_name),
		       COALESCE(w.balance, 0)
		FROM users u
		JOIN users_info ui ON ui.user_id = u.id
		LEFT JOIN wallets w ON w.user_id = u.id
		WHERE u.id = $1 AND u.deleted_at IS NULL`, userID,
	).Scan(&detail.UserID, &detail.FullName, &detail.CurrentBalance)
	if err != nil {
		return nil, fmt.Errorf("GetUserDetailForCashier: %w", err)
	}

	// Average weekly spend from sales over the last 4 weeks
	var avgWeekly sql.NullFloat64
	_ = r.db.QueryRowContext(ctx, `
		SELECT AVG(weekly_total)
		FROM (
			SELECT DATE_TRUNC('week', created_at) AS week, SUM(total_amount) AS weekly_total
			FROM sales
			WHERE user_id = $1
			  AND created_at >= NOW() - INTERVAL '4 weeks'
			GROUP BY DATE_TRUNC('week', created_at)
		) weekly`, userID,
	).Scan(&avgWeekly)

	if avgWeekly.Valid {
		detail.AvgWeeklySpend = avgWeekly.Float64
	}
	return &detail, nil
}

func (r *postgresRepository) AcceptRequest(ctx context.Context, requestID string, cashierID string) (string, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return "", fmt.Errorf("AcceptRequest begin tx: %w", err)
	}
	defer tx.Rollback()

	// 1. Lock the request row and verify it is still pending
	var req topUpRequestRow
	err = tx.QueryRowContext(ctx,
		`SELECT id, user_id, amount, status FROM top_up_requests WHERE id = $1 FOR UPDATE`,
		requestID,
	).Scan(&req.ID, &req.UserID, &req.Amount, &req.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrRequestNotFound
	}
	if err != nil {
		return "", fmt.Errorf("AcceptRequest lock: %w", err)
	}
	if req.Status != StatusPending {
		return "", ErrNotPending
	}

	// 2. Read current balance (balance_before)
	var balanceBefore float64
	if err := tx.QueryRowContext(ctx,
		`SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE`, req.UserID,
	).Scan(&balanceBefore); err != nil {
		return "", fmt.Errorf("AcceptRequest read balance: %w", err)
	}

	balanceAfter := balanceBefore + req.Amount

	// 3. Insert top_up_transactions row
	var txID string
	if err := tx.QueryRowContext(ctx,
		`INSERT INTO top_up_transactions (user_id, amount) VALUES ($1, $2) RETURNING id`,
		req.UserID, req.Amount,
	).Scan(&txID); err != nil {
		return "", fmt.Errorf("AcceptRequest insert top_up_transaction: %w", err)
	}

	// 4. Insert customers_ledger credit row
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO customers_ledger (user_id, debit, reference_id, reference_type)
		 VALUES ($1, $2, $3, 'top-up')`,
		req.UserID, req.Amount, txID,
	); err != nil {
		return "", fmt.Errorf("AcceptRequest insert ledger: %w", err)
	}

	// 5. Update wallet balance
	result, err := tx.ExecContext(ctx,
		`UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 AND balance + $1 >= 0`,
		req.Amount, req.UserID,
	)
	if err != nil {
		return "", fmt.Errorf("AcceptRequest update wallet: %w", err)
	}
	if n, _ := result.RowsAffected(); n == 0 {
		return "", fmt.Errorf("wallet update failed — insufficient balance or wallet not found")
	}

	// 6. Update the top_up_request row
	if _, err := tx.ExecContext(ctx,
		`UPDATE top_up_requests
		 SET status = 'accepted', cashier_id = $1, balance_before = $2, balance_after = $3
		 WHERE id = $4`,
		cashierID, balanceBefore, balanceAfter, requestID,
	); err != nil {
		return "", fmt.Errorf("AcceptRequest update request: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return "", fmt.Errorf("AcceptRequest commit: %w", err)
	}
	return txID, nil
}

func (r *postgresRepository) RejectRequest(ctx context.Context, requestID string, cashierID string, reason RejectionReason, comment string) error {
	result, err := r.db.ExecContext(ctx,
		`UPDATE top_up_requests
		 SET status = 'rejected', cashier_id = $1,
		     rejection_reason = $2::rejection_reason_type,
		     rejection_comment = NULLIF($3, '')
		 WHERE id = $4 AND status = 'pending'`,
		cashierID, string(reason), comment, requestID,
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

func (r *postgresRepository) ListRejectedRequests(ctx context.Context, params CashierListParams) ([]CashierRejectedRow, int, error) {
	return r.listCashierSection(ctx, "rejected", params)
}

func (r *postgresRepository) ListCompletedRequests(ctx context.Context, params CashierListParams) ([]CashierCompletedRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{}
	argIdx := 1
	conditions := []string{"r.status = 'accepted'"}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d", argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}
	dateFilter := r.buildDateFilter("r.created_at", params.DateStart, params.DateEnd, &args, &argIdx)
	if dateFilter != "true" {
		conditions = append(conditions, dateFilter)
	}

	where := "WHERE " + strings.Join(conditions, " AND ")

	base := fmt.Sprintf(`
		FROM top_up_requests r
		JOIN users u ON u.id = r.user_id
		JOIN users_info ui ON ui.user_id = u.id
		LEFT JOIN users cu ON cu.id = r.cashier_id
		LEFT JOIN users_info ci ON ci.user_id = cu.id
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListCompletedRequests count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT r.id,
		       CONCAT(ui.first_name, ' ', ui.last_name),
		       r.amount,
		       COALESCE(CONCAT(ci.first_name, ' ', ci.last_name), ''),
		       COALESCE(r.balance_before, 0),
		       COALESCE(r.balance_after, 0),
		       r.created_at
		%s
		ORDER BY r.created_at DESC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListCompletedRequests query: %w", err)
	}
	defer rows.Close()

	result := make([]CashierCompletedRow, 0)
	for rows.Next() {
		var row CashierCompletedRow
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

// listCashierSection is used by ListRejectedRequests (could be extended).
func (r *postgresRepository) listCashierSection(ctx context.Context, status string, params CashierListParams) ([]CashierRejectedRow, int, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	offset := (params.Page - 1) * params.Limit

	args := []any{}
	argIdx := 1
	conditions := []string{fmt.Sprintf("r.status = '%s'", status)}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d", argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}
	dateFilter := r.buildDateFilter("r.created_at", params.DateStart, params.DateEnd, &args, &argIdx)
	if dateFilter != "true" {
		conditions = append(conditions, dateFilter)
	}

	where := "WHERE " + strings.Join(conditions, " AND ")
	base := fmt.Sprintf(`
		FROM top_up_requests r
		JOIN users u ON u.id = r.user_id
		JOIN users_info ui ON ui.user_id = u.id
		LEFT JOIN users cu ON cu.id = r.cashier_id
		LEFT JOIN users_info ci ON ci.user_id = cu.id
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) `+base, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("listCashierSection count: %w", err)
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT r.id,
		       CONCAT(ui.first_name, ' ', ui.last_name),
		       r.amount,
		       COALESCE(r.rejection_reason::TEXT, ''),
		       r.rejection_comment,
		       COALESCE(CONCAT(ci.first_name, ' ', ci.last_name), ''),
		       r.created_at
		%s
		ORDER BY r.created_at DESC
		LIMIT $%d OFFSET $%d`, base, argIdx, argIdx+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("listCashierSection query: %w", err)
	}
	defer rows.Close()

	result := make([]CashierRejectedRow, 0)
	for rows.Next() {
		var row CashierRejectedRow
		var createdAt time.Time
		if err := rows.Scan(
			&row.ID, &row.FullName, &row.Amount,
			&row.RejectionReason, &row.RejectionComment,
			&row.CashierName, &createdAt,
		); err != nil {
			return nil, 0, fmt.Errorf("listCashierSection scan: %w", err)
		}
		row.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, row)
	}
	return result, total, rows.Err()
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

func (r *postgresRepository) GetUserNotifications(ctx context.Context, userID string) ([]UserNotification, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, type, message, metadata, is_read, created_at
		 FROM user_notifications
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT 50`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]UserNotification, 0)
	for rows.Next() {
		var n UserNotification
		var meta []byte
		if err := rows.Scan(&n.ID, &n.Type, &n.Message, &meta, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		if meta != nil {
			_ = json.Unmarshal(meta, &n.Metadata)
		}
		result = append(result, n)
	}
	return result, rows.Err()
}

func (r *postgresRepository) GetUserUnreadCount(ctx context.Context, userID string) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = false`, userID,
	).Scan(&count)
	return count, err
}

func (r *postgresRepository) MarkUserNotificationsRead(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE user_notifications SET is_read = true WHERE user_id = $1 AND is_read = false`, userID,
	)
	return err
}

func (r *postgresRepository) GetRequestByID(ctx context.Context, requestID string) (*topUpRequestRow, error) {
	var row topUpRequestRow
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, amount, status FROM top_up_requests WHERE id = $1`,
		requestID,
	).Scan(&row.ID, &row.UserID, &row.Amount, &row.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrRequestNotFound
	}
	return &row, err
}
