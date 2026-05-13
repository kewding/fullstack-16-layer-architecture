package vendortransactions

import "time"

// TxType mirrors the vendors_ledger_entry_type enum values exposed to the vendor.
type TxType string

const (
	TxAll        TxType = ""
	TxPurchase   TxType = "purchase"    // gross_profit entries
	TxRemittance TxType = "remittance"  // remittance entries
	TxFee        TxType = "fee"         // concession_fee entries
)

// ListRequest holds validated query params.
type ListRequest struct {
	VendorID string
	Type     TxType
	From     *time.Time
	To       *time.Time
	Page     int
	Limit    int
}

// VendorTxRow is one ledger row returned to the frontend.
type VendorTxRow struct {
	ID              string  `json:"id"`
	EntryType       TxType  `json:"entry_type"`
	// Human-readable label: "Purchase Revenue", "Remittance", "Concession Fee"
	Label           string  `json:"label"`
	Amount          float64 `json:"amount"`
	// direction: +1 (credit) or -1 (debit)
	Direction       int     `json:"direction"`
	// signed_amount = amount * direction (positive = credit, negative = debit)
	SignedAmount    float64 `json:"signed_amount"`
	// Running wallet balance after this entry
	NewBalance      float64 `json:"new_balance"`
	// For reference display — ledger entry id (gross_profit has no reference_id)
	ReferenceID     *string `json:"reference_id"`
	ReferenceNumber string  `json:"reference_number"` // always populated: reference_id or ledger id
	BillingMonth    *string `json:"billing_month"`
	CreatedAt       string  `json:"created_at"`
}

// ListResponse is the paginated envelope.
type ListResponse struct {
	Data       []VendorTxRow `json:"data"`
	Total      int           `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
}