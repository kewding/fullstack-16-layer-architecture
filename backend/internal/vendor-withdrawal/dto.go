package vendorwithdrawal

// RejectionReason mirrors the rejection_reason_type enum.
type RejectionReason string

const (
	ReasonSuspectedFraud RejectionReason = "suspected_fraud"
	ReasonUserCancelled  RejectionReason = "user_cancelled"
	ReasonOther          RejectionReason = "other"
)

// ── Vendor-facing DTOs ────────────────────────────────────────────────────────

type SubmitVendorWithdrawalRequest struct {
	Amount float64 `json:"amount" validate:"required,gt=0"`
}

type RejectVendorWithdrawalInput struct {
	Reason  RejectionReason `json:"reason"  validate:"required"`
	Comment string          `json:"comment"`
}

type PendingVendorWithdrawalResponse struct {
	ID        string  `json:"id"`
	Amount    float64 `json:"amount"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

// HistoryRow is what the vendor sees in the history table.
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

type VendorWithdrawalHistoryParams struct {
	Page      int
	Limit     int
	DateStart string
	DateEnd   string
}

type PaginatedVendorWithdrawalHistory struct {
	Data       []VendorWithdrawalHistoryRow `json:"data"`
	Total      int                          `json:"total"`
	Page       int                          `json:"page"`
	Limit      int                          `json:"limit"`
	TotalPages int                          `json:"total_pages"`
}

// ── Cashier-facing DTOs ───────────────────────────────────────────────────────

type CashierVendorWithdrawalParams struct {
	Page      int
	Limit     int
	Search    string
	DateStart string
	DateEnd   string
}

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

type PaginatedCashierVendorWithdrawals struct {
	Data       []CashierVendorWithdrawalRow `json:"data"`
	Total      int                          `json:"total"`
	Page       int                          `json:"page"`
	Limit      int                          `json:"limit"`
	TotalPages int                          `json:"total_pages"`
}

type PaginatedCashierVendorCompleted struct {
	Data       []CashierVendorWithdrawalCompletedRow `json:"data"`
	Total      int                                   `json:"total"`
	Page       int                                   `json:"page"`
	Limit      int                                   `json:"limit"`
	TotalPages int                                   `json:"total_pages"`
}

type PaginatedCashierVendorRejected struct {
	Data       []CashierVendorWithdrawalRejectedRow `json:"data"`
	Total      int                                  `json:"total"`
	Page       int                                  `json:"page"`
	Limit      int                                  `json:"limit"`
	TotalPages int                                  `json:"total_pages"`
}

// ── Internal ──────────────────────────────────────────────────────────────────

type vendorWithdrawalRow struct {
	ID       string
	UserID   string
	VendorID string
	Amount   float64
	Status   string
}