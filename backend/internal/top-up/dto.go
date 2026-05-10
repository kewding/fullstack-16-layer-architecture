package topup

import (
	"time"

	"github.com/shopspring/decimal"
)

type TopupCreditingRequest struct {
	Rfid   string          `json:"rfid" validate:"required,min=8,max=100"`
	Amount decimal.Decimal `json:"amount" validate:"required,min=1,max=3000"`
}

type TopupCreditingResponse struct {
	TransactionID string          `json:"transaction_id"`
	UserID        string          `json:"user_id"`
	Amount        decimal.Decimal `json:"amount"`
	Timestamp     time.Time       `json:"timestamp"`
}

// ── enums ─────────────────────────────────────────────────────────────────────

type RequestStatus string
type RejectionReason string

const (
	StatusPending   RequestStatus = "pending"
	StatusAccepted  RequestStatus = "accepted"
	StatusRejected  RequestStatus = "rejected"
	StatusCancelled RequestStatus = "cancelled"

	ReasonCancelledUponPayment RejectionReason = "cancelled_upon_payment"
	ReasonWrongRequest         RejectionReason = "wrong_request"
	ReasonOther                RejectionReason = "other"
)

// ── user-facing DTOs ──────────────────────────────────────────────────────────

type SubmitRequestInput struct {
	Amount float64 `json:"amount" validate:"required,min=1,max=5000"`
}

type PendingRequestResponse struct {
	ID        string  `json:"id"`
	Amount    float64 `json:"amount"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

type TopUpHistoryRow struct {
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

type TopUpHistoryParams struct {
	Page      int
	Limit     int
	DateStart string
	DateEnd   string
}

type PaginatedTopUpHistory struct {
	Data       []TopUpHistoryRow `json:"data"`
	Total      int               `json:"total"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	TotalPages int               `json:"total_pages"`
}

// ── cashier-facing DTOs ───────────────────────────────────────────────────────

type CashierListParams struct {
	Page      int
	Limit     int
	Search    string
	DateStart string
	DateEnd   string
}

type CashierRequestRow struct {
	ID        string  `json:"id"`
	UserID    string  `json:"user_id"`
	FullName  string  `json:"full_name"`
	Amount    float64 `json:"amount"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

type UserDetailForCashier struct {
	UserID         string  `json:"user_id"`
	FullName       string  `json:"full_name"`
	CurrentBalance float64 `json:"current_balance"`
	AvgWeeklySpend float64 `json:"avg_weekly_spend"`
}

type CashierRejectedRow struct {
	ID               string  `json:"id"`
	FullName         string  `json:"full_name"`
	Amount           float64 `json:"amount"`
	RejectionReason  string  `json:"rejection_reason"`
	RejectionComment *string `json:"rejection_comment"`
	CashierName      string  `json:"cashier_name"`
	CreatedAt        string  `json:"created_at"`
}

type CashierCompletedRow struct {
	ID            string  `json:"id"`
	FullName      string  `json:"full_name"`
	Amount        float64 `json:"amount"`
	CashierName   string  `json:"cashier_name"`
	BalanceBefore float64 `json:"balance_before"`
	BalanceAfter  float64 `json:"balance_after"`
	CreatedAt     string  `json:"created_at"`
}

type PaginatedCashierRequests struct {
	Data       []CashierRequestRow `json:"data"`
	Total      int                 `json:"total"`
	Page       int                 `json:"page"`
	Limit      int                 `json:"limit"`
	TotalPages int                 `json:"total_pages"`
}

type PaginatedCashierRejected struct {
	Data       []CashierRejectedRow `json:"data"`
	Total      int                  `json:"total"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalPages int                  `json:"total_pages"`
}

type PaginatedCashierCompleted struct {
	Data       []CashierCompletedRow `json:"data"`
	Total      int                   `json:"total"`
	Page       int                   `json:"page"`
	Limit      int                   `json:"limit"`
	TotalPages int                   `json:"total_pages"`
}

type RejectRequestInput struct {
	Reason  RejectionReason `json:"reason"  validate:"required"`
	Comment string          `json:"comment"`
}

// ── user notification DTOs ────────────────────────────────────────────────────

type UserNotification struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	Message   string                 `json:"message"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	IsRead    bool                   `json:"is_read"`
	CreatedAt time.Time              `json:"created_at"`
}
