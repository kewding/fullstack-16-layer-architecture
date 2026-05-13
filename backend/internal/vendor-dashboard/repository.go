package vendordashboard

import "context"

// Repository is the data-access contract for the vendor dashboard.
type Repository interface {
	// GetDailyGrossProfit returns the sum of sales.total_amount for today
	// for the given vendor's stall (identified by vendorID).
	GetDailyGrossProfit(ctx context.Context, vendorID string) (float64, error)

	// GetActiveFeeTotal returns the sum of all 4 active concession fee components
	// for the current month (most recent row per fee_type where effective_month <= today).
	GetActiveFeeTotal(ctx context.Context) (float64, error)

	// GetWalletBalance returns the live wallet.balance for the vendor's user_id.
	GetWalletBalance(ctx context.Context, vendorID string) (float64, error)

	// GetTopSellingItems returns the top N products for this vendor ranked by total quantity sold.
	GetTopSellingItems(ctx context.Context, vendorID string, limit int) ([]TopSellingItem, error)

	// GetTopRatedItems returns the top N products for this vendor ranked by average rating.
	// Only products with at least 1 rating are included.
	GetTopRatedItems(ctx context.Context, vendorID string, limit int) ([]TopRatedItem, error)

	// GetAllergenInterventionCount returns the count of allergen interventions
	// for this vendor's stall in the last 7 days.
	GetAllergenInterventionCount(ctx context.Context, vendorID string) (int, error)

	// GetAllergenInterventionTable returns the most recent allergen interventions
	// for this vendor's stall in the last 7 days, ordered by created_at DESC.
	GetAllergenInterventionTable(ctx context.Context, vendorID string) ([]AllergenInterventionRow, error)

	// GetVendorIDByUserID resolves the vendor's ID from their user_id (JWT claim).
	GetVendorIDByUserID(ctx context.Context, userID string) (string, error)
}