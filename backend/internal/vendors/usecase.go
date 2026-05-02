package vendors

import (
	"context"
	"math"
)

type UseCase interface {
	ListVendorsReview(ctx context.Context, params ListVendorsParams) (*PaginatedResponse[VendorReviewRow], error)
	ListVendorsBalance(ctx context.Context, params ListVendorsParams) (*PaginatedResponse[VendorBalanceRow], error)
	
	GetVendorDetail(ctx context.Context, vendorID string) (*VendorDetailResponse, error)
	
	ApproveVendor(ctx context.Context, vendorID string) (string, error)
	
	GetNotifications(ctx context.Context) ([]Notification, error)
	MarkNotificationsRead(ctx context.Context) error
	GetUnreadCount(ctx context.Context) (int, error)
	CreateNotification(ctx context.Context, notifType string, message string) error
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

func (uc *vendorUseCase) GetVendorDetail(ctx context.Context, vendorID string) (*VendorDetailResponse, error) {
	return uc.repo.GetVendorDetail(ctx, vendorID)
}

func (uc *vendorUseCase) ApproveVendor(ctx context.Context, vendorID string) (string, error) {
	return uc.repo.ApproveVendor(ctx, vendorID)
}

func (uc *vendorUseCase) GetNotifications(ctx context.Context) ([]Notification, error) {
	return uc.repo.GetNotifications(ctx)
}

func (uc *vendorUseCase) MarkNotificationsRead(ctx context.Context) error {
	return uc.repo.MarkNotificationsRead(ctx)
}

func (uc *vendorUseCase) GetUnreadCount(ctx context.Context) (int, error) {
	return uc.repo.GetUnreadCount(ctx)
}

func (uc *vendorUseCase) CreateNotification(ctx context.Context, notifType string, message string) error {
	return uc.repo.CreateNotification(ctx, notifType, message)
}