package productratings

import "errors"

var (
	// ErrNotPurchased is returned when the user has not purchased the product
	// via the given sale_id.
	ErrNotPurchased = errors.New("you can only rate products you have purchased")

	// ErrAlreadyRated is returned when the user has already rated this product.
	// They must update their existing rating instead.
	ErrAlreadyRated = errors.New("you have already rated this product")

	// ErrInvalidRating is returned when the rating is not a valid 0.5-step value.
	ErrInvalidRating = errors.New("rating must be between 1.0 and 5.0 in 0.5 increments")
)