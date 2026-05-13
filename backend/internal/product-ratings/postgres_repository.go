package productratings

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"time"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

// HasPurchased verifies the sale belongs to the user and contains the product.
func (r *postgresRepository) HasPurchased(ctx context.Context, userID, productID, saleID string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM sales sa
			JOIN sales_items si ON si.sales_id = sa.id
			WHERE sa.id      = $1
			  AND sa.user_id = $2
			  AND si.products_id = $3
		)`,
		saleID, userID, productID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("HasPurchased: %w", err)
	}
	return exists, nil
}

// UpsertRating inserts or updates a product_ratings row.
// Uses ON CONFLICT to handle the unique constraint (product_id, user_id).
func (r *postgresRepository) UpsertRating(ctx context.Context, userID string, req SubmitRatingRequest) (*RatingResponse, error) {
	// Validate half-step constraint in application layer as well
	doubled := req.Rating * 2
	if math.Mod(doubled, 1) != 0 || req.Rating < 1.0 || req.Rating > 5.0 {
		return nil, ErrInvalidRating
	}

	var nullableReview *string
	if req.Review != "" {
		nullableReview = &req.Review
	}

	var res RatingResponse
	var createdAt time.Time
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO product_ratings (product_id, user_id, sale_id, rating, review)
		VALUES ($1::UUID, $2::UUID, $3::UUID, $4, $5)
		ON CONFLICT (product_id, user_id) DO UPDATE
		SET rating     = EXCLUDED.rating,
		    review     = EXCLUDED.review,
		    sale_id    = EXCLUDED.sale_id,
		    updated_at = NOW()
		RETURNING id::TEXT, product_id::TEXT, rating, review, created_at`,
		req.ProductID, userID, req.SaleID, req.Rating, nullableReview,
	).Scan(&res.ID, &res.ProductID, &res.Rating, &res.Review, &createdAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("UpsertRating: unexpected no rows")
	}
	if err != nil {
		return nil, fmt.Errorf("UpsertRating: %w", err)
	}

	res.CreatedAt = createdAt.Format(time.RFC3339)
	return &res, nil
}