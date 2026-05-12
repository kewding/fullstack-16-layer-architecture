package user

import "context"

type UseCase interface {
	GetUser(ctx context.Context, userID string) (*GetUserResponse, error)
	GetWallet(ctx context.Context, userID string) (*WalletResponse, error)

	GetAdminInfo(ctx context.Context, userID string) (*AdminInfoResponse, error)
	UpdateAdminInfo(ctx context.Context, userID string, req UpdateAdminInfoRequest) error

	ListCustomers(ctx context.Context, req ListCustomersRequest) (*ListCustomersResponse, error)
	GetCustomerDetail(ctx context.Context, userID string) (*CustomerDetailResponse, error)
	DisableCustomer(ctx context.Context, userID string) error
	ReactivateCustomer(ctx context.Context, userID string) error

	GetUserProfile(ctx context.Context, userID string) (*UserProfileResponse, error)
	UpdateUserProfile(ctx context.Context, userID string, req UpdateUserProfileRequest) error
}

type userUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &userUseCase{repo: repo}
}

func (uc *userUseCase) GetUser(ctx context.Context, userID string) (*GetUserResponse, error) {
	return uc.repo.GetUserByID(ctx, userID)
}

func (uc *userUseCase) GetWallet(ctx context.Context, userID string) (*WalletResponse, error) {
	return uc.repo.GetWallet(ctx, userID)
}

func (uc *userUseCase) GetAdminInfo(ctx context.Context, userID string) (*AdminInfoResponse, error) {
	return uc.repo.GetAdminInfo(ctx, userID)
}

func (uc *userUseCase) UpdateAdminInfo(ctx context.Context, userID string, req UpdateAdminInfoRequest) error {
	return uc.repo.UpdateAdminInfo(ctx, userID, req)
}

func (uc *userUseCase) ListCustomers(ctx context.Context, req ListCustomersRequest) (*ListCustomersResponse, error) {
	return uc.repo.ListCustomers(ctx, req)
}

func (uc *userUseCase) GetCustomerDetail(ctx context.Context, userID string) (*CustomerDetailResponse, error) {
	return uc.repo.GetCustomerDetail(ctx, userID)
}

func (uc *userUseCase) DisableCustomer(ctx context.Context, userID string) error {
	return uc.repo.DisableCustomer(ctx, userID)
}

func (uc *userUseCase) ReactivateCustomer(ctx context.Context, userID string) error {
	return uc.repo.ReactivateCustomer(ctx, userID)
}

func (uc *userUseCase) GetUserProfile(ctx context.Context, userID string) (*UserProfileResponse, error) {
	return uc.repo.GetUserProfile(ctx, userID)
}

func (uc *userUseCase) UpdateUserProfile(ctx context.Context, userID string, req UpdateUserProfileRequest) error {
	return uc.repo.UpdateUserProfile(ctx, userID, req)
}
