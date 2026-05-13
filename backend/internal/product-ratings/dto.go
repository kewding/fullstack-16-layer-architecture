package productratings

// SubmitRatingRequest is the body for POST /api/customer/ratings
type SubmitRatingRequest struct {
	ProductID string  `json:"product_id" validate:"required,uuid"`
	SaleID    string  `json:"sale_id"    validate:"required,uuid"`
	Rating    float64 `json:"rating"     validate:"required,min=1,max=5"`
	Review    string  `json:"review"`
}

// RatingResponse is returned after a successful rating submission.
type RatingResponse struct {
	ID        string  `json:"id"`
	ProductID string  `json:"product_id"`
	Rating    float64 `json:"rating"`
	Review    *string `json:"review"`
	CreatedAt string  `json:"created_at"`
}