package dashboard

import "context"

type Repository interface {
	// Stat cards
	GetStatCards(ctx context.Context, req DateRangeRequest) (*StatCardsResponse, error)

	// NQS trend — always current week Mon–Fri, date range not applied
	GetNQSTrend(ctx context.Context) (*NQSTrendResponse, error)

	// Allergen interventions table
	GetAllergenInterventions(ctx context.Context, req DateRangeRequest) (*AllergenInterventionsResponse, error)

	// Nutritional target status diverging bar
	GetNutritionalTarget(ctx context.Context, req DateRangeRequest) (*NutritionalTargetResponse, error)

	// Revenue distribution modal (date-range filtered)
	GetRevenueDistribution(ctx context.Context, req DateRangeRequest) (*RevenueDistributionResponse, error)

	// Stall settlement — NOT date-range filtered
	GetStallSettlement(ctx context.Context) (*StallSettlementResponse, error)
}