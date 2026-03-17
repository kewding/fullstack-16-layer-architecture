package user

import "context"

type UseCase interface {
	GetUser(ctx context.Context, userID string) (*GetUserResponse, error)
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