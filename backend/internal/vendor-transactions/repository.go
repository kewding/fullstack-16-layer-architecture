package vendortransactions

// Repository is the data-access contract for vendor transactions.
type Repository interface {
	List(req ListRequest) ([]VendorTxRow, int, error)
	GetVendorIDByUserID(userID string) (string, error)
}