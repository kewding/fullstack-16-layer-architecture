package admintransactions

import (
	"context"
	"math"
)

type UseCase interface {
	ListVendorTransactions(ctx context.Context, params ListVendorTxParams) (*PaginatedVendorTx, error)
	ListCustomerTransactions(ctx context.Context, params ListCustomerTxParams) (*PaginatedCustomerTx, error)
	GetPurchaseDetail(ctx context.Context, saleID string) (*PurchaseDetail, error)
}

type useCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &useCase{repo: repo}
}

func (uc *useCase) ListVendorTransactions(ctx context.Context, params ListVendorTxParams) (*PaginatedVendorTx, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	data, total, err := uc.repo.ListVendorTransactions(ctx, params)
	if err != nil {
		return nil, err
	}
	return &PaginatedVendorTx{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *useCase) ListCustomerTransactions(ctx context.Context, params ListCustomerTxParams) (*PaginatedCustomerTx, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	data, total, err := uc.repo.ListCustomerTransactions(ctx, params)
	if err != nil {
		return nil, err
	}
	return &PaginatedCustomerTx{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *useCase) GetPurchaseDetail(ctx context.Context, saleID string) (*PurchaseDetail, error) {
	return uc.repo.GetPurchaseDetail(ctx, saleID)
}