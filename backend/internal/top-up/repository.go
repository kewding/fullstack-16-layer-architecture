package topup

import (
	"context"

	"github.com/shopspring/decimal"
)

type Repository interface {
	RfidExists(ctx context.Context, rfid string) (string, error)

	BeginTx(ctx context.Context) (Tx, error)

	CreditTopupAmount(ctx context.Context, tx Tx, userID string, amount decimal.Decimal) (string, error)
	LedgerRecordsCredit(ctx context.Context, tx Tx, userID string, amount decimal.Decimal, transactionID string, transactionType string) (string, error)
	UpdateWalletBalance(ctx context.Context, tx Tx, userID string, amount decimal.Decimal) error 

	// ── user ──────────────────────────────────────────────────────────────────

	// HasPendingRequest returns true if the user already has a pending request.
	HasPendingRequest(ctx context.Context, userID string) (bool, error)

	// GetWalletBalance returns the current wallet balance for the user.
	GetWalletBalance(ctx context.Context, userID string) (float64, error)

	// GetUserRoleID returns the role_id of a user (to decide whether to enforce wallet cap).
	GetUserRoleID(ctx context.Context, userID string) (int, error)

	// SubmitRequest inserts a new pending top-up request.
	SubmitRequest(ctx context.Context, userID string, amount float64) (string, error)

	// GetPendingRequest returns the single pending request for a user (nil if none).
	GetPendingRequest(ctx context.Context, userID string) (*PendingRequestResponse, error)

	// CancelRequest sets a pending request to cancelled. Returns ErrNotPending if
	// the request is no longer in pending state.
	CancelRequest(ctx context.Context, requestID string, userID string) error

	// ListTopUpHistory returns all non-pending top-up requests for a user.
	ListTopUpHistory(ctx context.Context, userID string, params TopUpHistoryParams) ([]TopUpHistoryRow, int, error)

	// ── cashier ───────────────────────────────────────────────────────────────

	// ListPendingRequests returns paginated pending requests for the cashier dashboard.
	ListPendingRequests(ctx context.Context, params CashierListParams) ([]CashierRequestRow, int, error)

	// GetUserDetailForCashier returns the balance and avg weekly spend for a user.
	GetUserDetailForCashier(ctx context.Context, userID string) (*UserDetailForCashier, error)

	// AcceptRequest atomically:
	//   1. Reads current wallet balance (balance_before)
	//   2. Inserts a top_up_transactions row
	//   3. Inserts a customers_ledger credit row
	//   4. Updates the wallet balance (balance + amount)
	//   5. Updates the top_up_request row: status=accepted, cashier_id, balance_before, balance_after
	// Returns the top_up_transactions ID so the notifier can reference it.
	AcceptRequest(ctx context.Context, requestID string, cashierID string) (string, error)

	// RejectRequest updates the request status to rejected and stores reason/comment.
	RejectRequest(ctx context.Context, requestID string, cashierID string, reason RejectionReason, comment string) error

	// ListRejectedRequests returns paginated rejected requests for the cashier.
	ListRejectedRequests(ctx context.Context, params CashierListParams) ([]CashierRejectedRow, int, error)

	// ListCompletedRequests returns paginated accepted requests for the cashier.
	ListCompletedRequests(ctx context.Context, params CashierListParams) ([]CashierCompletedRow, int, error)

	// ── notifications ─────────────────────────────────────────────────────────

	// CreateUserNotification inserts a user_notification row.
	CreateUserNotification(ctx context.Context, userID string, notifType string, message string, metadata map[string]interface{}) error

	// GetUserNotifications returns the latest 50 notifications for a user.
	GetUserNotifications(ctx context.Context, userID string) ([]UserNotification, error)

	// GetUserUnreadCount returns the number of unread notifications for a user.
	GetUserUnreadCount(ctx context.Context, userID string) (int, error)

	// MarkUserNotificationsRead marks all unread notifications for a user as read.
	MarkUserNotificationsRead(ctx context.Context, userID string) error

	// GetRequestByID returns a single request row used to look up userID after acceptance/rejection.
	GetRequestByID(ctx context.Context, requestID string) (*topUpRequestRow, error)
}

// topUpRequestRow is an internal type used only by the repository layer.
type topUpRequestRow struct {
	ID     string
	UserID string
	Amount float64
	Status RequestStatus
}

type Tx interface {
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}