package productratings

import (
	"context"
)

// UseCase is the business-logic contract for product ratings.
type UseCase interface {
	SubmitRating(ctx context.Context, userID string, req SubmitRatingRequest) (*RatingResponse, error)
}

type ratingsUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &ratingsUseCase{repo: repo}
}

func (uc *ratingsUseCase) SubmitRating(ctx context.Context, userID string, req SubmitRatingRequest) (*RatingResponse, error) {
	// 1. Verify proof of purchase
	purchased, err := uc.repo.HasPurchased(ctx, userID, req.ProductID, req.SaleID)
	if err != nil {
		return nil, err
	}
	if !purchased {
		return nil, ErrNotPurchased
	}

	// 2. Upsert rating (insert or update existing)
	return uc.repo.UpsertRating(ctx, userID, req)
}
