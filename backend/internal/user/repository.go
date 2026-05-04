package user

import "context"

type Repository interface {
	GetUserByID(ctx context.Context, userID string) (*GetUserResponse, error)
	GetWallet(ctx context.Context, userID string) (*WalletResponse, error)

	GetAdminInfo(ctx context.Context, userID string) (*AdminInfoResponse, error)   
	UpdateAdminInfo(ctx context.Context, userID string, req UpdateAdminInfoRequest) error 
}