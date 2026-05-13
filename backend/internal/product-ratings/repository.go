package productratings

import "context"

// Repository is the data-access contract for product ratings.
type Repository interface {
	// HasPurchased checks that the given sale contains the product AND belongs to the user.
	HasPurchased(ctx context.Context, userID, productID, saleID string) (bool, error)

	// UpsertRating inserts or updates a rating row (one per user per product).
	// Returns ErrAlreadyRated if a rating already exists and the caller should
	// use UpdateRating instead (the controller calls Upsert which handles both).
	UpsertRating(ctx context.Context, userID string, req SubmitRatingRequest) (*RatingResponse, error)
}