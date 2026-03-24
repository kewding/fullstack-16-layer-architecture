package user

import "context"

type Repository interface {
	GetUserByID(ctx context.Context, userID string) (*GetUserResponse, error)
	GetWallet(ctx context.Context, userID string) (*WalletResponse, error)
}