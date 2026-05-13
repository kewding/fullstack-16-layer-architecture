package vendorwithdrawal

import "context"

type Repository interface {
	// ── shared helpers ────────────────────────────────────────────────────────
	GetVendorByUserID(ctx context.Context, userID string) (vendorID string, walletBalance float64, err error)
	GetWalletBalance(ctx context.Context, userID string) (float64, error)
	GetCashierName(ctx context.Context, cashierID string) (string, error)

	// ── vendor ────────────────────────────────────────────────────────────────
	HasPendingRequest(ctx context.Context, userID string) (bool, error)
	SubmitRequest(ctx context.Context, userID string, vendorID string, amount float64) (string, error)
	GetPendingRequest(ctx context.Context, userID string) (*PendingVendorWithdrawalResponse, error)
	DeletePendingRequest(ctx context.Context, requestID string, userID string) error
	ListHistory(ctx context.Context, userID string, params VendorWithdrawalHistoryParams) ([]VendorWithdrawalHistoryRow, int, error)

	// ── cashier ───────────────────────────────────────────────────────────────
	GetRequestByID(ctx context.Context, requestID string) (*vendorWithdrawalRow, error)
	ListPendingRequests(ctx context.Context, params CashierVendorWithdrawalParams) ([]CashierVendorWithdrawalRow, int, error)
	// CompleteRequest atomically:
	//   1. Deducts wallet balance
	//   2. Inserts vendors_ledger remittance DEBIT entry
	//   3. Updates the withdrawal request row (status, snapshots)
	// Returns the ledger entry ID.
	CompleteRequest(ctx context.Context, requestID string, cashierID string, cashierName string) error
	RejectRequest(ctx context.Context, requestID string, cashierID string, cashierName string, reason RejectionReason, comment string) error
	ListCompletedRequests(ctx context.Context, params CashierVendorWithdrawalParams) ([]CashierVendorWithdrawalCompletedRow, int, error)
	ListRejectedRequests(ctx context.Context, params CashierVendorWithdrawalParams) ([]CashierVendorWithdrawalRejectedRow, int, error)
	GetPendingCount(ctx context.Context) (int, error)

	// ── notifications ─────────────────────────────────────────────────────────
	CreateUserNotification(ctx context.Context, userID string, notifType string, message string, metadata map[string]interface{}) error
}