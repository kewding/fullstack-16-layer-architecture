package vendors

import (
	"context"
	"math"
)

type UseCase interface {
	ListVendorsReview(ctx context.Context, params ListVendorsParams) (*PaginatedResponse[VendorReviewRow], error)
	ListVendorsBalance(ctx context.Context, params ListVendorsParams) (*PaginatedResponse[VendorBalanceRow], error)
}

type vendorUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &vendorUseCase{repo: repo}
}

func (uc *vendorUseCase) ListVendorsReview(ctx context.Context, params ListVendorsParams) (*PaginatedResponse[VendorReviewRow], error) {
	if params.Limit == 0 {
		params.Limit = 10
	}
	if params.Page == 0 {
		params.Page = 1
	}

	data, total, err := uc.repo.ListVendorsReview(ctx, params)
	if err != nil {
		return nil, err
	}

	return &PaginatedResponse[VendorReviewRow]{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *vendorUseCase) ListVendorsBalance(ctx context.Context, params ListVendorsParams) (*PaginatedResponse[VendorBalanceRow], error) {
	if params.Limit == 0 {
		params.Limit = 10
	}
	if params.Page == 0 {
		params.Page = 1
	}

	data, total, err := uc.repo.ListVendorsBalance(ctx, params)
	if err != nil {
		return nil, err
	}

	return &PaginatedResponse[VendorBalanceRow]{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}