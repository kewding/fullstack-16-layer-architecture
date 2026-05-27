package vendorwithdrawal

// RejectionReason mirrors the rejection_reason_type enum used across the app.
type RejectionReason string

const (
	ReasonSuspectedFraud RejectionReason = "suspected_fraud"
	ReasonUserCancelled  RejectionReason = "user_cancelled"
	ReasonOther          RejectionReason = "other"
)

// ── vendor-facing ─────────────────────────────────────────────────────────────

// SubmitWithdrawalRequest is the body for POST /vendor-auth/withdraw/request.
type SubmitWithdrawalRequest struct {
	Amount float64 `json:"amount"`
}

// PendingVendorWithdrawalResponse is returned for a single pending request.
type PendingVendorWithdrawalResponse struct {
	ID        string  `json:"id"`
	Amount    float64 `json:"amount"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

// VendorWithdrawalHistoryParams filters for the vendor's own history list.
type VendorWithdrawalHistoryParams struct {
	Page      int
	Limit     int
	DateStart string
	DateEnd   string
}

// VendorWithdrawalHistoryRow is one row in the vendor's history list.
type VendorWithdrawalHistoryRow struct {
	ID               string   `json:"id"`
	Amount           float64  `json:"amount"`
	Status           string   `json:"status"`
	CashierName      *string  `json:"cashier_name"`
	RejectionReason  *string  `json:"rejection_reason"`
	RejectionComment *string  `json:"rejection_comment"`
	BalanceBefore    *float64 `json:"balance_before"`
	BalanceAfter     *float64 `json:"balance_after"`
	CreatedAt        string   `json:"created_at"`
}

// PaginatedVendorWithdrawalHistory is the paginated envelope for vendor history.
type PaginatedVendorWithdrawalHistory struct {
	Data       []VendorWithdrawalHistoryRow `json:"data"`
	Total      int                          `json:"total"`
	Page       int                          `json:"page"`
	Limit      int                          `json:"limit"`
	TotalPages int                          `json:"total_pages"`
}

// ── cashier-facing ────────────────────────────────────────────────────────────

// CashierVendorWithdrawalParams filters for cashier list views.
type CashierVendorWithdrawalParams struct {
	Page      int
	Limit     int
	Search    string
	DateStart string
	DateEnd   string
}

// CashierVendorWithdrawalRow is one row in the cashier's pending list.
type CashierVendorWithdrawalRow struct {
	ID        string  `json:"id"`
	UserID    string  `json:"user_id"`
	VendorID  string  `json:"vendor_id"`
	FullName  string  `json:"full_name"`
	StallName string  `json:"stall_name"`
	Amount    float64 `json:"amount"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

// CashierVendorWithdrawalCompletedRow is one row in the completed list.
type CashierVendorWithdrawalCompletedRow struct {
	ID            string  `json:"id"`
	FullName      string  `json:"full_name"`
	StallName     string  `json:"stall_name"`
	Amount        float64 `json:"amount"`
	CashierName   string  `json:"cashier_name"`
	BalanceBefore float64 `json:"balance_before"`
	BalanceAfter  float64 `json:"balance_after"`
	CreatedAt     string  `json:"created_at"`
}

// CashierVendorWithdrawalRejectedRow is one row in the rejected list.
type CashierVendorWithdrawalRejectedRow struct {
	ID               string  `json:"id"`
	FullName         string  `json:"full_name"`
	StallName        string  `json:"stall_name"`
	Amount           float64 `json:"amount"`
	RejectionReason  string  `json:"rejection_reason"`
	RejectionComment *string `json:"rejection_comment"`
	CashierName      string  `json:"cashier_name"`
	CreatedAt        string  `json:"created_at"`
}

// PaginatedCashierVendorWithdrawals — pending list envelope.
type PaginatedCashierVendorWithdrawals struct {
	Data       []CashierVendorWithdrawalRow `json:"data"`
	Total      int                          `json:"total"`
	Page       int                          `json:"page"`
	Limit      int                          `json:"limit"`
	TotalPages int                          `json:"total_pages"`
}

// PaginatedCashierVendorCompleted — completed list envelope.
type PaginatedCashierVendorCompleted struct {
	Data       []CashierVendorWithdrawalCompletedRow `json:"data"`
	Total      int                                   `json:"total"`
	Page       int                                   `json:"page"`
	Limit      int                                   `json:"limit"`
	TotalPages int                                   `json:"total_pages"`
}

// PaginatedCashierVendorRejected — rejected list envelope.
type PaginatedCashierVendorRejected struct {
	Data       []CashierVendorWithdrawalRejectedRow `json:"data"`
	Total      int                                  `json:"total"`
	Page       int                                  `json:"page"`
	Limit      int                                  `json:"limit"`
	TotalPages int                                  `json:"total_pages"`
}

// RejectVendorWithdrawalInput is the body for the reject endpoint.
type RejectVendorWithdrawalInput struct {
	Reason  RejectionReason `json:"reason"`
	Comment string          `json:"comment"`
}

// WalletBalanceResponse is returned by GET /vendor-auth/withdraw/balance.
type WalletBalanceResponse struct {
	Balance float64 `json:"balance"`
}

// ── internal ──────────────────────────────────────────────────────────────────

// vendorWithdrawalRow is the internal DB row used between repo and use-case.
type vendorWithdrawalRow struct {
	ID       string
	UserID   string
	VendorID string
	Amount   float64
	Status   string
}