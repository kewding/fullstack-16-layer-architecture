package vendorwithdrawal

import "context"

// Repository is the data-access contract for vendor withdrawal requests.
type Repository interface {
	// ── helpers ───────────────────────────────────────────────────────────────

	// GetVendorByUserID resolves the vendor_id and current wallet balance for a
	// vendor user. Returns ErrVendorNotFound when no active vendor row exists.
	GetVendorByUserID(ctx context.Context, userID string) (vendorID string, balance float64, err error)

	// GetWalletBalance returns the live wallet.balance for the given user_id.
	GetWalletBalance(ctx context.Context, userID string) (float64, error)

	// GetCashierName returns "first_name last_name" for the given cashier user_id.
	GetCashierName(ctx context.Context, cashierID string) (string, error)

	// GetRequestByID fetches a single request row by primary key.
	// Returns ErrRequestNotFound when absent.
	GetRequestByID(ctx context.Context, requestID string) (*vendorWithdrawalRow, error)

	// ── vendor ────────────────────────────────────────────────────────────────

	// HasPendingRequest checks whether the vendor already has a pending request.
	HasPendingRequest(ctx context.Context, userID string) (bool, error)

	// SubmitRequest inserts a new pending request and returns its generated ID.
	SubmitRequest(ctx context.Context, userID string, vendorID string, amount float64) (id string, err error)

	// GetPendingRequest returns the most recent pending request for the vendor,
	// or nil when none exists.
	GetPendingRequest(ctx context.Context, userID string) (*PendingVendorWithdrawalResponse, error)

	// DeletePendingRequest hard-deletes the pending request owned by the vendor.
	// Returns ErrNotPending when the row is absent or not pending.
	DeletePendingRequest(ctx context.Context, requestID string, userID string) error

	// ListHistory returns paginated non-pending requests for the vendor.
	ListHistory(ctx context.Context, userID string, params VendorWithdrawalHistoryParams) ([]VendorWithdrawalHistoryRow, int, error)

	// ── cashier ───────────────────────────────────────────────────────────────

	// ListPendingRequests returns paginated pending requests across all vendors.
	ListPendingRequests(ctx context.Context, params CashierVendorWithdrawalParams) ([]CashierVendorWithdrawalRow, int, error)

	// CompleteRequest atomically:
	//   1. Locks and verifies the request is pending.
	//   2. Deducts the vendor's wallet balance.
	//   3. Inserts a vendors_ledger remittance DEBIT entry.
	//   4. Marks the request completed with balance snapshots.
	CompleteRequest(ctx context.Context, requestID string, cashierID string, cashierName string) error

	// RejectRequest marks the request as rejected with a reason.
	RejectRequest(ctx context.Context, requestID string, cashierID string, cashierName string, reason RejectionReason, comment string) error

	// ListCompletedRequests returns paginated completed requests.
	ListCompletedRequests(ctx context.Context, params CashierVendorWithdrawalParams) ([]CashierVendorWithdrawalCompletedRow, int, error)

	// ListRejectedRequests returns paginated rejected requests.
	ListRejectedRequests(ctx context.Context, params CashierVendorWithdrawalParams) ([]CashierVendorWithdrawalRejectedRow, int, error)

	// GetPendingCount returns the count of all pending requests across all vendors.
	GetPendingCount(ctx context.Context) (int, error)

	// ── notifications ─────────────────────────────────────────────────────────

	// CreateUserNotification inserts a row into user_notifications for the vendor.
	CreateUserNotification(ctx context.Context, userID string, notifType string, message string, metadata map[string]interface{}) error
}