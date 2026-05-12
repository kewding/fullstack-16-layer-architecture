package withdrawal

// ── Rejection reasons ─────────────────────────────────────────────────────────

type RejectionReason string

const (
	ReasonSuspectedFraud RejectionReason = "suspected_fraud"
	ReasonUserCancelled  RejectionReason = "user_cancelled"
	ReasonOther          RejectionReason = "other"
)

// ── Request / Response DTOs ───────────────────────────────────────────────────

type SubmitWithdrawalRequest struct {
	Amount float64 `json:"amount" validate:"required,gt=0,lte=50000"`
}

type RejectWithdrawalInput struct {
	Reason  RejectionReason `json:"reason"  validate:"required"`
	Comment string          `json:"comment"`
}

// ── Pending request (customer view) ──────────────────────────────────────────

type PendingWithdrawalResponse struct {
	ID        string  `json:"id"`
	Amount    float64 `json:"amount"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

// ── History row (customer view) ───────────────────────────────────────────────

type WithdrawalHistoryRow struct {
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

type WithdrawalHistoryParams struct {
	Page      int
	Limit     int
	DateStart string
	DateEnd   string
}

type PaginatedWithdrawalHistory struct {
	Data       []WithdrawalHistoryRow `json:"data"`
	Total      int                    `json:"total"`
	Page       int                    `json:"page"`
	Limit      int                    `json:"limit"`
	TotalPages int                    `json:"total_pages"`
}

// ── Cashier request row ───────────────────────────────────────────────────────

type CashierWithdrawalRow struct {
	ID        string  `json:"id"`
	UserID    string  `json:"user_id"`
	FullName  string  `json:"full_name"`
	Amount    float64 `json:"amount"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

type CashierWithdrawalParams struct {
	Page      int
	Limit     int
	Search    string
	DateStart string
	DateEnd   string
}

type PaginatedCashierWithdrawals struct {
	Data       []CashierWithdrawalRow `json:"data"`
	Total      int                    `json:"total"`
	Page       int                    `json:"page"`
	Limit      int                    `json:"limit"`
	TotalPages int                    `json:"total_pages"`
}

// ── Cashier completed rows ────────────────────────────────────────────────────

type CashierWithdrawalCompletedRow struct {
	ID            string  `json:"id"`
	FullName      string  `json:"full_name"`
	Amount        float64 `json:"amount"`
	CashierName   string  `json:"cashier_name"`
	BalanceBefore float64 `json:"balance_before"`
	BalanceAfter  float64 `json:"balance_after"`
	CreatedAt     string  `json:"created_at"`
}

type PaginatedCashierWithdrawalCompleted struct {
	Data       []CashierWithdrawalCompletedRow `json:"data"`
	Total      int                             `json:"total"`
	Page       int                             `json:"page"`
	Limit      int                             `json:"limit"`
	TotalPages int                             `json:"total_pages"`
}

// ── Cashier rejected rows ─────────────────────────────────────────────────────

type CashierWithdrawalRejectedRow struct {
	ID               string  `json:"id"`
	FullName         string  `json:"full_name"`
	Amount           float64 `json:"amount"`
	RejectionReason  string  `json:"rejection_reason"`
	RejectionComment *string `json:"rejection_comment"`
	CashierName      string  `json:"cashier_name"`
	CreatedAt        string  `json:"created_at"`
}

type PaginatedCashierWithdrawalRejected struct {
	Data       []CashierWithdrawalRejectedRow `json:"data"`
	Total      int                            `json:"total"`
	Page       int                            `json:"page"`
	Limit      int                            `json:"limit"`
	TotalPages int                            `json:"total_pages"`
}

// ── Internal row (repository only) ───────────────────────────────────────────

type withdrawalRequestRow struct {
	ID     string
	UserID string
	Amount float64
	Status string
}