package vendors

type VendorStatusFilter string

const (
	StatusAll        VendorStatusFilter = ""
	StatusInvited    VendorStatusFilter = "invited"
	StatusForReview  VendorStatusFilter = "for_review"
	StatusInBusiness VendorStatusFilter = "in_business"
)

type ListVendorsParams struct {
	Search string
	Status VendorStatusFilter
	Page   int
	Limit  int
}

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

type VendorBalanceRow struct {
	ID                 string   `json:"id"`
	StallName          *string  `json:"stall_name"`
	OwnerName          *string  `json:"owner_name"`
	VendorProfit       float64  `json:"vendor_profit"`
	ConcessionFeeType  *string  `json:"concession_fee_type"`
	ConcessionFeeValue *float64 `json:"concession_fee_value"`
	ConcessionFee      float64  `json:"concession_fee"`
	NetProfit          float64  `json:"net_profit"`
}

type PaginatedResponse[T any] struct {
	Data       []T `json:"data"`
	Total      int `json:"total"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"total_pages"`
}

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

type Notification struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Message   string `json:"message"`
	IsRead    bool   `json:"is_read"`
	CreatedAt string `json:"created_at"`
}