package user

import "context"

type UseCase interface {
	GetUser(ctx context.Context, userID string) (*GetUserResponse, error)
	GetWallet(ctx context.Context, userID string) (*WalletResponse, error)

	GetAdminInfo(ctx context.Context, userID string) (*AdminInfoResponse, error)
	UpdateAdminInfo(ctx context.Context, userID string, req UpdateAdminInfoRequest) error
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