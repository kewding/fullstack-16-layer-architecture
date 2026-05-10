package vendorsledger

// EntryType mirrors the vendors_ledger_entry_type enum.
type EntryType string

const (
	EntryTypeGrossProfit   EntryType = "gross_profit"
	EntryTypeConcessionFee EntryType = "concession_fee"
	EntryTypeRemittance    EntryType = "remittance"
)

// Direction constants.
const (
	DirectionCredit int = 1
	DirectionDebit  int = -1
)

// LedgerEntry is a single row from vendors_ledger.
type LedgerEntry struct {
	ID            string    `json:"id"`
	EntryType     EntryType `json:"entry_type"`
	Amount        float64   `json:"amount"`
	Direction     int       `json:"direction"`
	SignedAmount  float64   `json:"signed_amount"`  // amount * direction
	BillingMonth  *string   `json:"billing_month"`  // YYYY-MM-DD or null
	ReferenceID   *string   `json:"reference_id"`
	ReferenceType *string   `json:"reference_type"`
	Note          *string   `json:"note"`
	CreatedAt     string    `json:"created_at"`
}

// GetLedgerResponse is the paginated ledger for a vendor.
type GetLedgerResponse struct {
	Data         []LedgerEntry `json:"data"`
	Total        int           `json:"total"`
	Page         int           `json:"page"`
	Limit        int           `json:"limit"`
	TotalPages   int           `json:"total_pages"`
	NetBalance   float64       `json:"net_balance"`   // SUM(amount * direction) across ALL entries
}

// PostMonthlyRequest allows manually triggering a monthly post for a specific billing_month.
// If BillingMonth is empty, defaults to the previous calendar month.
type PostMonthlyRequest struct {
	BillingMonth string `json:"billing_month"` // YYYY-MM-DD (1st of month), optional
}

// InsertLedgerEntryParams is used internally when posting ledger entries.
type InsertLedgerEntryParams struct {
	VendorID      string
	EntryType     EntryType
	Amount        float64
	Direction     int
	BillingMonth  *string
	ReferenceID   *string
	ReferenceType *string
	Note          *string
}