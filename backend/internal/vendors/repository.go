package vendors

import "context"

type Repository interface {
	// ── Vendor lists ──────────────────────────────────────────────────────────
	ListVendorsReview(ctx context.Context, params ListVendorsParams) ([]VendorReviewRow, int, error)
	ListVendorsBalance(ctx context.Context, params ListVendorsParams) ([]VendorBalanceRow, int, error)

	// ── Vendor detail ─────────────────────────────────────────────────────────
	GetVendorDetail(ctx context.Context, vendorID string) (*VendorDetailResponse, error)

	// ── Approve (for_review → in_business) ───────────────────────────────────
	ApproveVendor(ctx context.Context, vendorID string) (string, error)

	// ── Revoke invitation (invited / for_review → deleted) ───────────────────
	// Updates vendor_invitations with the reason then soft-deletes the vendor row.
	RevokeVendorWithReason(ctx context.Context, vendorID string, req RevokeVendorRequest) error

	// ── Graduate (in_business → former_vendor) ────────────────────────────────
	// Validates wallet is zero, writes former_vendors snapshot, soft-deletes users row.
	// Returns data needed for email/notification side effects.
	GraduateVendor(ctx context.Context, vendorID string, adminUserID string, req GraduateVendorRequest) (*GraduateVendorResult, error)

	// GetWalletBalance returns the wallet.balance for a vendor's user_id.
	GetWalletBalance(ctx context.Context, vendorID string) (float64, error)

	// ── Former vendors ────────────────────────────────────────────────────────
	ListFormerVendors(ctx context.Context, params ListFormerVendorsParams) ([]FormerVendorRow, int, error)
	GetFormerVendorDetail(ctx context.Context, formerVendorID string) (*FormerVendorDetail, error)

	// GetFormerVendorLedgerCSV returns all vendors_ledger rows for the given
	// vendor_id as a slice of maps, ordered by created_at ASC (for CSV export).
	GetFormerVendorLedgerRows(ctx context.Context, vendorID string) ([]LedgerCSVRow, error)

	// ── Notifications ─────────────────────────────────────────────────────────
	CreateNotification(ctx context.Context, notifType string, message string) error
	GetNotifications(ctx context.Context) ([]Notification, error)
	MarkNotificationsRead(ctx context.Context) error
	GetUnreadCount(ctx context.Context) (int, error)
}

// LedgerCSVRow is a flattened ledger row used for CSV export.
type LedgerCSVRow struct {
	ID            string
	EntryType     string
	Amount        float64
	Direction     int
	SignedAmount   float64
	BillingMonth  string
	ReferenceID   string
	ReferenceType string
	Note          string
	CreatedAt     string
}