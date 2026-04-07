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