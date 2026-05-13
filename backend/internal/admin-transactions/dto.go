package admintransactions

type VendorTxType string
type CustomerTxType string

const (
	VendorTxAll        VendorTxType = ""
	VendorTxSale       VendorTxType = "sale"
	VendorTxRemittance VendorTxType = "remittance"

	CustomerTxAll      CustomerTxType = ""
	CustomerTxPurchase CustomerTxType = "purchase"
	CustomerTxTopUp    CustomerTxType = "top-up"
	CustomerTxRefund   CustomerTxType = "refund"
	CustomerTxWithdraw CustomerTxType = "withdraw"
)

type ListVendorTxParams struct {
	Page      int
	Limit     int
	Search    string
	Type      VendorTxType
	DateStart string
	DateEnd   string
}

type ListCustomerTxParams struct {
	Page      int
	Limit     int
	Search    string
	Type      CustomerTxType
	DateStart string
	DateEnd   string
}

type VendorTxRow struct {
	ID        string  `json:"id"`
	Date      string  `json:"date"`
	Type      string  `json:"type"`
	OwnerName string  `json:"owner_name"`
	StallName string  `json:"stall_name"`
	Amount    float64 `json:"amount"`
}

type CustomerTxRow struct {
	ID       string  `json:"id"`
	Date     string  `json:"date"`
	Type     string  `json:"type"`
	FullName string  `json:"full_name"`
	Amount   float64 `json:"amount"`
	Status   string  `json:"status"`
}

type PurchaseItem struct {
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
	Extended    float64 `json:"extended"`
}

type PurchaseDetail struct {
	SaleID    string         `json:"sale_id"`
	StallName string         `json:"stall_name"`
	Total     float64        `json:"total"`
	Items     []PurchaseItem `json:"items"`
}

type PaginatedVendorTx struct {
	Data       []VendorTxRow `json:"data"`
	Total      int           `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
}

type PaginatedCustomerTx struct {
	Data       []CustomerTxRow `json:"data"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"total_pages"`
}
//