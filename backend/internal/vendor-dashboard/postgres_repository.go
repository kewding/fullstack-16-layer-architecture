package vendordashboard

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

// GetVendorIDByUserID resolves vendor ID from JWT user_id.
func (r *postgresRepository) GetVendorIDByUserID(ctx context.Context, userID string) (string, error) {
	var vendorID string
	err := r.db.QueryRowContext(ctx,
		`SELECT id FROM vendors WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
		userID,
	).Scan(&vendorID)
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrVendorNotFound
	}
	if err != nil {
		return "", fmt.Errorf("GetVendorIDByUserID: %w", err)
	}
	return vendorID, nil
}

// GetDailyGrossProfit sums today's sales for the vendor's stall.
func (r *postgresRepository) GetDailyGrossProfit(ctx context.Context, vendorID string) (float64, error) {
	var total float64
	err := r.db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(sa.total_amount), 0)
		FROM sales sa
		JOIN stalls st ON st.id = sa.stall_id
		JOIN vendors v  ON v.user_id = st.user_id
		WHERE v.id = $1
		  AND sa.created_at >= CURRENT_DATE
		  AND sa.created_at <  CURRENT_DATE + INTERVAL '1 day'
		  AND sa.status = 'completed'`,
		vendorID,
	).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("GetDailyGrossProfit: %w", err)
	}
	return total, nil
}

// GetActiveFeeTotal returns the sum of all 4 active concession fee components
// for the current month using the most recent row per fee_type.
func (r *postgresRepository) GetActiveFeeTotal(ctx context.Context) (float64, error) {
	currentMonth := fmt.Sprintf("%d-%02d-01", time.Now().Year(), time.Now().Month())
	var total float64
	err := r.db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(latest.amount), 0)
		FROM (
			SELECT DISTINCT ON (fee_type) amount
			FROM concession_fee_settings
			WHERE effective_month <= $1::DATE
			ORDER BY fee_type, effective_month DESC
		) latest`,
		currentMonth,
	).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("GetActiveFeeTotal: %w", err)
	}
	return total, nil
}

// GetWalletBalance returns the vendor's live wallet balance.
func (r *postgresRepository) GetWalletBalance(ctx context.Context, vendorID string) (float64, error) {
	var balance float64
	err := r.db.QueryRowContext(ctx, `
		SELECT COALESCE(w.balance, 0)
		FROM vendors v
		LEFT JOIN wallets w ON w.user_id = v.user_id
		WHERE v.id = $1 AND v.deleted_at IS NULL`,
		vendorID,
	).Scan(&balance)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, ErrVendorNotFound
	}
	if err != nil {
		return 0, fmt.Errorf("GetWalletBalance: %w", err)
	}
	return balance, nil
}

// GetTopSellingItems returns the top N products ranked by total quantity sold.
func (r *postgresRepository) GetTopSellingItems(ctx context.Context, vendorID string, limit int) ([]TopSellingItem, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			p.id::TEXT,
			p.product_name,
			COALESCE(SUM(si.quantity), 0)       AS total_qty,
			COALESCE(SUM(si.extended_price), 0) AS total_revenue,
			p.image_url
		FROM products p
		JOIN stalls st       ON st.id = p.stall_id
		JOIN vendors v       ON v.user_id = st.user_id
		LEFT JOIN sales_items si ON si.products_id = p.id
		LEFT JOIN sales sa       ON sa.id = si.sales_id AND sa.status = 'completed'
		WHERE v.id = $1
		  AND v.deleted_at IS NULL
		GROUP BY p.id, p.product_name, p.image_url
		ORDER BY total_qty DESC
		LIMIT $2`,
		vendorID, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("GetTopSellingItems: %w", err)
	}
	defer rows.Close()

	items := make([]TopSellingItem, 0)
	for rows.Next() {
		var item TopSellingItem
		if err := rows.Scan(
			&item.ProductID,
			&item.ProductName,
			&item.TotalQty,
			&item.TotalRev,
			&item.ImageURL,
		); err != nil {
			return nil, fmt.Errorf("GetTopSellingItems scan: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// GetTopRatedItems returns the top N products ranked by average rating (min 1 rating).
func (r *postgresRepository) GetTopRatedItems(ctx context.Context, vendorID string, limit int) ([]TopRatedItem, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			p.id::TEXT,
			p.product_name,
			ROUND(AVG(pr.rating)::NUMERIC, 1) AS avg_rating,
			COUNT(pr.id)                      AS rating_count,
			p.image_url
		FROM products p
		JOIN stalls st          ON st.id = p.stall_id
		JOIN vendors v          ON v.user_id = st.user_id
		JOIN product_ratings pr ON pr.product_id = p.id
		JOIN sales sa           ON sa.id = pr.sale_id AND sa.status = 'completed'
		WHERE v.id = $1
		  AND v.deleted_at IS NULL
		GROUP BY p.id, p.product_name, p.image_url
		HAVING COUNT(pr.id) >= 1
		ORDER BY avg_rating DESC, rating_count DESC
		LIMIT $2`,
		vendorID, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("GetTopRatedItems: %w", err)
	}
	defer rows.Close()

	items := make([]TopRatedItem, 0)
	for rows.Next() {
		var item TopRatedItem
		if err := rows.Scan(
			&item.ProductID,
			&item.ProductName,
			&item.AvgRating,
			&item.RatingCount,
			&item.ImageURL,
		); err != nil {
			return nil, fmt.Errorf("GetTopRatedItems scan: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// GetAllergenInterventionCount returns the count of interventions in the last 7 days
// for this vendor's stall.
func (r *postgresRepository) GetAllergenInterventionCount(ctx context.Context, vendorID string) (int, error) {
	since := time.Now().AddDate(0, 0, -7)
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(ai.id)
		FROM allergen_interventions ai
		JOIN stalls st  ON st.id = ai.stall_id
		JOIN vendors v  ON v.user_id = st.user_id
		WHERE v.id = $1
		  AND ai.created_at >= $2`,
		vendorID, since,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("GetAllergenInterventionCount: %w", err)
	}
	return count, nil
}

// GetAllergenInterventionTable returns recent interventions for this vendor's stall (last 7 days).
func (r *postgresRepository) GetAllergenInterventionTable(ctx context.Context, vendorID string) ([]AllergenInterventionRow, error) {
	since := time.Now().AddDate(0, 0, -7)
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			ai.created_at,
			p.product_name,
			ai.allergen_matched
		FROM allergen_interventions ai
		JOIN products p ON p.id = ai.product_id
		JOIN stalls st  ON st.id = ai.stall_id
		JOIN vendors v  ON v.user_id = st.user_id
		WHERE v.id = $1
		  AND ai.created_at >= $2
		ORDER BY ai.created_at DESC
		LIMIT 50`,
		vendorID, since,
	)
	if err != nil {
		return nil, fmt.Errorf("GetAllergenInterventionTable: %w", err)
	}
	defer rows.Close()

	data := make([]AllergenInterventionRow, 0)
	for rows.Next() {
		var row AllergenInterventionRow
		var createdAt time.Time
		if err := rows.Scan(&createdAt, &row.ProductName, &row.Allergen); err != nil {
			return nil, fmt.Errorf("GetAllergenInterventionTable scan: %w", err)
		}
		row.Time = createdAt.Format(time.RFC3339)
		data = append(data, row)
	}
	return data, rows.Err()
}