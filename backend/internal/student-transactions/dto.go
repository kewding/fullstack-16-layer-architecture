package studenttransactions

import "time"

// TransactionType mirrors the transaction_type ENUM in the DB.
// Only the types relevant to a student ledger are exposed here.
type TransactionType string

const (
	TypeAll      TransactionType = ""
	TypePurchase TransactionType = "purchase"
	TypeTopUp    TransactionType = "top-up"
	TypeWithdraw TransactionType = "withdraw"
)

// ListRequest holds validated query params from the controller.
type ListRequest struct {
	UserID string
	Type   TransactionType // "" means all
	From   *time.Time
	To     *time.Time
	Page   int
	Limit  int
}

// TransactionRow is one ledger row returned to the client.
type TransactionRow struct {
	ID              string          `json:"id"`
	ReferenceID    string          `json:"reference_id"`
	ReferenceType   TransactionType `json:"reference_type"`
	// Human-readable label sent to the frontend ("Balance Top-up", "Purchase", "Withdrawal")
	Label           string          `json:"label"`
	Amount          float64         `json:"amount"`   // positive = credit, negative = debit
	NewBalance      float64         `json:"new_balance"`
	PurchaseStatus  string          `json:"status"`   // "completed" | "refunded" | "blocked" | "" for top-ups
	CreatedAt       time.Time       `json:"created_at"`
}

// ListResponse is the paginated envelope returned by the use-case.
type ListResponse struct {
	Data       []TransactionRow `json:"data"`
	Total      int              `json:"total"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalPages int              `json:"total_pages"`
}