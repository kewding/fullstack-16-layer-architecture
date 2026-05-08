package user

import "context"

type Repository interface {
	GetUserByID(ctx context.Context, userID string) (*GetUserResponse, error)
	GetWallet(ctx context.Context, userID string) (*WalletResponse, error)

	GetAdminInfo(ctx context.Context, userID string) (*AdminInfoResponse, error)
	UpdateAdminInfo(ctx context.Context, userID string, req UpdateAdminInfoRequest) error

	ListCustomers(ctx context.Context, req ListCustomersRequest) (*ListCustomersResponse, error)
	GetCustomerDetail(ctx context.Context, userID string) (*CustomerDetailResponse, error)
	DisableCustomer(ctx context.Context, userID string) error
	ReactivateCustomer(ctx context.Context, userID string) error
}
