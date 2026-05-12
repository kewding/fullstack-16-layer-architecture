package withdrawal

import "context"

type Repository interface {
	// ── shared helpers ────────────────────────────────────────────────────────
	GetWalletBalance(ctx context.Context, userID string) (float64, error)
	GetCashierName(ctx context.Context, cashierID string) (string, error)

	// ── user ──────────────────────────────────────────────────────────────────
	HasPendingRequest(ctx context.Context, userID string) (bool, error)
	SubmitRequest(ctx context.Context, userID string, amount float64) (string, error)
	GetPendingRequest(ctx context.Context, userID string) (*PendingWithdrawalResponse, error)
	DeletePendingRequest(ctx context.Context, requestID string, userID string) error
	ListHistory(ctx context.Context, userID string, params WithdrawalHistoryParams) ([]WithdrawalHistoryRow, int, error)

	// ── cashier ───────────────────────────────────────────────────────────────
	GetRequestByID(ctx context.Context, requestID string) (*withdrawalRequestRow, error)
	ListPendingRequests(ctx context.Context, params CashierWithdrawalParams) ([]CashierWithdrawalRow, int, error)
	CompleteRequest(ctx context.Context, requestID string, cashierID string, cashierName string) error
	RejectRequest(ctx context.Context, requestID string, cashierID string, cashierName string, reason RejectionReason, comment string) error
	ListCompletedRequests(ctx context.Context, params CashierWithdrawalParams) ([]CashierWithdrawalCompletedRow, int, error)
	ListRejectedRequests(ctx context.Context, params CashierWithdrawalParams) ([]CashierWithdrawalRejectedRow, int, error)
	GetPendingCount(ctx context.Context) (int, error)

	// ── notifications ─────────────────────────────────────────────────────────
	CreateUserNotification(ctx context.Context, userID string, notifType string, message string, metadata map[string]interface{}) error
}

type Tx interface {
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}