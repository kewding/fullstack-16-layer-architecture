package userdashboard

import "context"

// UseCase defines the business logic interface for the user dashboard.
type UseCase interface {
	GetNutritionData(ctx context.Context, userID string) (*NutritionResponse, error)
	GetRecentPurchases(ctx context.Context, userID string) (*PurchasesResponse, error)
}

type userDashboardUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &userDashboardUseCase{repo: repo}
}

func (uc *userDashboardUseCase) GetNutritionData(ctx context.Context, userID string) (*NutritionResponse, error) {
	return uc.repo.GetNutritionData(ctx, userID)
}

func (uc *userDashboardUseCase) GetRecentPurchases(ctx context.Context, userID string) (*PurchasesResponse, error) {
	return uc.repo.GetRecentPurchases(ctx, userID)
}