package vendors

// ── Status filter ─────────────────────────────────────────────────────────────

type VendorStatusFilter string

const (
	StatusAll        VendorStatusFilter = ""
	StatusInvited    VendorStatusFilter = "invited"
	StatusForReview  VendorStatusFilter = "for_review"
	StatusInBusiness VendorStatusFilter = "in_business"
)

// ── List params ───────────────────────────────────────────────────────────────

type ListVendorsParams struct {
	Search string
	Status VendorStatusFilter
	Page   int
	Limit  int
}

// ── Review table row ──────────────────────────────────────────────────────────

type VendorReviewRow struct {
	ID            string  `json:"id"`
	Email         string  `json:"email"`
	OwnerName     string  `json:"owner_name"`
	StallName     *string `json:"stall_name"`
	Status        string  `json:"status"`
	InvitedByName string  `json:"invited_by_name"`
	InvitedAt     string  `json:"invited_at"`
	RegisteredAt  *string `json:"registered_at"`
}

// ── Balance table row ─────────────────────────────────────────────────────────
// VendorBalanceRow is returned by ListVendorsBalance.
// WalletBalance is the live wallet.balance (the authoritative figure since the
// ledger debits/credits are what drive that value).

type VendorBalanceRow struct {
	ID                 string   `json:"id"`
	StallName          *string  `json:"stall_name"`
	OwnerName          *string  `json:"owner_name"`
	VendorProfit       float64  `json:"vendor_profit"`
	ConcessionFeeValue *float64 `json:"concession_fee_value"`
	ConcessionFee      float64  `json:"concession_fee"`
	NetProfit          float64  `json:"net_profit"`
	WalletBalance      float64  `json:"wallet_balance"`
}

// ── Generic pagination ────────────────────────────────────────────────────────

type PaginatedResponse[T any] struct {
	Data       []T `json:"data"`
	Total      int `json:"total"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"total_pages"`
}

// ── Vendor detail (used by both review modal and balance view modal) ───────────

type VendorDetailResponse struct {
	ID     string `json:"id"`
	Email  string `json:"email"`
	Status string `json:"status"`

	// personal info
	FirstName     string `json:"first_name"`
	MiddleName    string `json:"middle_name"`
	LastName      string `json:"last_name"`
	BirthDate     string `json:"birth_date"`
	ContactNumber string `json:"contact_number"`
	StallName     string `json:"stall_name"`

	// business info
	DtiSecNumber              string  `json:"dti_sec_number"`
	Tin                       string  `json:"tin"`
	ProofOfBusinessAddressURL *string `json:"proof_of_business_address_url"`
	BarangayClearanceURL      *string `json:"barangay_clearance_url"`
	MayorsPermitURL           *string `json:"mayors_permit_url"`
	IsDtiVerified             bool    `json:"is_dti_verified"`
	IsTinVerified             bool    `json:"is_tin_verified"`
	IsDocumentsVerified       bool    `json:"is_documents_verified"`
}

// ── Notifications ─────────────────────────────────────────────────────────────

type Notification struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Message   string `json:"message"`
	IsRead    bool   `json:"is_read"`
	CreatedAt string `json:"created_at"`
}

// ── Revoke (for_review / invited) ─────────────────────────────────────────────

// RevokeVendorRequest is the body sent by the frontend when revoking a vendor
// that is in invited or for_review status.
type RevokeVendorRequest struct {
	// Reasons: one or more of "wrong_invite" | "did_not_proceed" | "others"
	Reasons     []string `json:"reasons"`
	OtherReason string   `json:"other_reason"` // populated when "others" is selected
}

// ── Graduate to former vendor ─────────────────────────────────────────────────

// GraduateVendorRequest is the body sent by the admin when removing an
// in_business vendor and moving them to the former_vendors archive.
type GraduateVendorRequest struct {
	// Reasons: one or more of "wrong_invite" | "terminated_contract" |
	//           "insufficient_credentials" | "others"
	Reasons     []string `json:"reasons"`
	OtherReason string   `json:"other_reason"`
}

// GraduateVendorResult carries the data needed for email/notification side effects.
type GraduateVendorResult struct {
	Email     string
	OwnerName string
	StallName string
	Reasons   []string
	OtherReason string
}

// ── Former vendors list ───────────────────────────────────────────────────────

type ListFormerVendorsParams struct {
	Search   string
	DateFrom string // YYYY-MM-DD, filter on removed_at
	DateTo   string // YYYY-MM-DD
	Page     int
	Limit    int
}

type FormerVendorRow struct {
	ID          string  `json:"id"`
	StallName   string  `json:"stall_name"`
	Email       string  `json:"email"`
	OwnerName   string  `json:"owner_name"`
	RemovedBy   string  `json:"removed_by"`   // full name of the admin
	RemovedAt   string  `json:"removed_at"`
}

// FormerVendorDetail is returned by the view modal.
type FormerVendorDetail struct {
	ID          string      `json:"id"`
	VendorID    string      `json:"vendor_id"`
	StallName   string      `json:"stall_name"`
	Email       string      `json:"email"`
	OwnerName   string      `json:"owner_name"`
	RemovedBy   string      `json:"removed_by"`
	RemovedAt   string      `json:"removed_at"`

	Reasons     []string    `json:"reasons"`
	OtherReason *string     `json:"other_reason"`

	// Snapshots (raw JSON — frontend parses as needed)
	PersonalInfo  interface{} `json:"personal_info"`
	BusinessInfo  interface{} `json:"business_info"`
	LedgerSummary interface{} `json:"ledger_summary"`
}

// ── Legacy RemoveFromBusinessData (kept for any existing callers) ─────────────
// Deprecated: use GraduateVendorResult instead.
type RemoveFromBusinessData struct {
	Email      string
	OwnerName  string
	StallName  string
	Balance    float64
	TotalSales float64
}