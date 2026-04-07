package vendors

import "context"

type Repository interface {
	ListVendorsReview(ctx context.Context, params ListVendorsParams) ([]VendorReviewRow, int, error)
	ListVendorsBalance(ctx context.Context, params ListVendorsParams) ([]VendorBalanceRow, int, error)
}