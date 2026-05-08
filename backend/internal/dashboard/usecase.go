package dashboard

import "context"

type UseCase interface {
	GetStatCards(ctx context.Context, req DateRangeRequest) (*StatCardsResponse, error)
	GetNQSTrend(ctx context.Context) (*NQSTrendResponse, error)
	GetAllergenInterventions(ctx context.Context, req DateRangeRequest) (*AllergenInterventionsResponse, error)
	GetNutritionalTarget(ctx context.Context, req DateRangeRequest) (*NutritionalTargetResponse, error)
	GetRevenueDistribution(ctx context.Context, req DateRangeRequest) (*RevenueDistributionResponse, error)
	GetStallSettlement(ctx context.Context) (*StallSettlementResponse, error)
}

type dashboardUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &dashboardUseCase{repo: repo}
}

func (uc *dashboardUseCase) GetStatCards(ctx context.Context, req DateRangeRequest) (*StatCardsResponse, error) {
	return uc.repo.GetStatCards(ctx, req)
}

func (uc *dashboardUseCase) GetNQSTrend(ctx context.Context) (*NQSTrendResponse, error) {
	return uc.repo.GetNQSTrend(ctx)
}

func (uc *dashboardUseCase) GetAllergenInterventions(ctx context.Context, req DateRangeRequest) (*AllergenInterventionsResponse, error) {
	return uc.repo.GetAllergenInterventions(ctx, req)
}

func (uc *dashboardUseCase) GetNutritionalTarget(ctx context.Context, req DateRangeRequest) (*NutritionalTargetResponse, error) {
	return uc.repo.GetNutritionalTarget(ctx, req)
}

func (uc *dashboardUseCase) GetRevenueDistribution(ctx context.Context, req DateRangeRequest) (*RevenueDistributionResponse, error) {
	return uc.repo.GetRevenueDistribution(ctx, req)
}

func (uc *dashboardUseCase) GetStallSettlement(ctx context.Context) (*StallSettlementResponse, error) {
	return uc.repo.GetStallSettlement(ctx)
}