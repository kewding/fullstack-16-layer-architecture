package admintransactions

import "context"

type Repository interface {
	ListVendorTransactions(ctx context.Context, params ListVendorTxParams) ([]VendorTxRow, int, error)
	ListCustomerTransactions(ctx context.Context, params ListCustomerTxParams) ([]CustomerTxRow, int, error)
	GetPurchaseDetail(ctx context.Context, saleID string) (*PurchaseDetail, error)
}