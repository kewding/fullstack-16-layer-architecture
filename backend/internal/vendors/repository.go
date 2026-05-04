package vendors

import "context"

type Repository interface {
	ListVendorsReview(ctx context.Context, params ListVendorsParams) ([]VendorReviewRow, int, error)
	ListVendorsBalance(ctx context.Context, params ListVendorsParams) ([]VendorBalanceRow, int, error)

	GetVendorDetail(ctx context.Context, vendorID string) (*VendorDetailResponse, error)

	ApproveVendor(ctx context.Context, vendorID string) (string, error)
	RemoveFromBusiness(ctx context.Context, vendorID string) (*RemoveFromBusinessData, error)
	
	CreateNotification(ctx context.Context, notifType string, message string) error
	GetNotifications(ctx context.Context) ([]Notification, error)
	MarkNotificationsRead(ctx context.Context) error
	GetUnreadCount(ctx context.Context) (int, error)

	
}