package userdashboard

import "context"

// Repository defines the data access methods for the user dashboard package.
type Repository interface {
	// GetNutritionData returns today's summed nutrient totals and the
	// user-specific daily limits computed from their profile.
	GetNutritionData(ctx context.Context, userID string) (*NutritionResponse, error)

	// GetRecentPurchases returns up to 5 of the most recent sales items
	// for the user where the corresponding customers_ledger entry has
	// purchase_status IN ('completed', 'blocked') and reference_type = 'purchase'.
	GetRecentPurchases(ctx context.Context, userID string) (*PurchasesResponse, error)
}