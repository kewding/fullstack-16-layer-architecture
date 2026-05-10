package vendorsledger

import "context"

// Repository is the data-access contract for the vendors_ledger.
type Repository interface {
	// GetLedger returns paginated ledger entries for a vendor plus the net balance.
	GetLedger(ctx context.Context, vendorID string, page, limit int) (*GetLedgerResponse, error)

	// InsertEntry inserts one ledger entry and atomically updates the vendor's wallet.balance.
	// Returns ErrAlreadyPosted if a unique constraint fires (gross_profit/concession_fee per month).
	InsertEntry(ctx context.Context, params InsertLedgerEntryParams) error

	// GetNetBalance returns SUM(amount * direction) for a vendor across all ledger entries.
	GetNetBalance(ctx context.Context, vendorID string) (float64, error)

	// GetAllInBusinessVendorIDs returns the vendor IDs (and their user_ids) of all
	// vendors with status = 'in_business'.
	GetAllInBusinessVendors(ctx context.Context) ([]VendorRef, error)

	// GetGrossProfitForMonth returns the sum of sales.total_amount for a vendor
	// for the given billing month (1st of month to last day of month).
	GetGrossProfitForMonth(ctx context.Context, vendorID string, billingMonth string) (float64, error)

	// GetActiveFeeForMonth returns the sum of all 4 concession fee components
	// that were active during the given billing month.
	GetActiveFeeForMonth(ctx context.Context, billingMonth string) (float64, error)

	GetVendorIDByUserID(ctx context.Context, userID string) (string, error)
}

// VendorRef holds the minimum fields needed for monthly posting.
type VendorRef struct {
	VendorID string
	UserID   string // for wallet update
}