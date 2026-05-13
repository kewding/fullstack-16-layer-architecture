package userdashboard

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

// ── GetNutritionData ──────────────────────────────────────────────────────────

func (r *postgresRepository) GetNutritionData(ctx context.Context, userID string) (*NutritionResponse, error) {
	// 1. Fetch user profile fields needed for limit calculation.
	//    We need: birth_date, weight_kg, biological_sex.
	//    All nullable — user may not have filled medical info yet.
	profileQuery := `
		SELECT
			ui.birth_date,
			mi.weight_kg,
			mi.biological_sex
		FROM users_info ui
		LEFT JOIN medical_information mi ON mi.user_id = ui.user_id
		WHERE ui.user_id = $1
		LIMIT 1`

	var birthDate time.Time
	var weightKG sql.NullFloat64
	var biologicalSex sql.NullString

	err := r.db.QueryRowContext(ctx, profileQuery, userID).Scan(
		&birthDate,
		&weightKG,
		&biologicalSex,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Return zeroed response rather than an error — user just has no data yet.
			return &NutritionResponse{}, nil
		}
		return nil, fmt.Errorf("GetNutritionData profile query: %w", err)
	}

	// 2. Compute user-specific limits.
	limits := computeLimits(birthDate, weightKG, biologicalSex)

	// 3. Sum today's nutrient intake from completed/blocked purchases.
	//    Window: start of calendar day (local midnight) to now.
	//    We use DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') — the frontend
	//    passes timezone if needed; for now we use the DB server timezone.
	//    The sales table stores created_at as TIMESTAMPTZ, so we truncate in UTC.
	//    If the app needs per-user timezone, pass it as a parameter in future.
	totalsQuery := `
		SELECT
			COALESCE(SUM(pn.calories_kcal  * si.quantity), 0),
			COALESCE(SUM(pn.protein_g      * si.quantity), 0),
			COALESCE(SUM(pn.total_fat_g    * si.quantity), 0),
			COALESCE(SUM(pn.fiber_g        * si.quantity), 0),
			COALESCE(SUM(pn.sugar_g        * si.quantity), 0),
			COALESCE(SUM(pn.sodium_mg      * si.quantity), 0),
			COALESCE(SUM(pn.iron_mg        * si.quantity), 0),
			COALESCE(SUM(pn.calcium_mg     * si.quantity), 0),
			COALESCE(SUM(pn.vitamin_a_mcg  * si.quantity), 0),
			COALESCE(SUM(pn.vitamin_c_mg   * si.quantity), 0),
			COALESCE(SUM(pn.vitamin_e_mg   * si.quantity), 0),
			COALESCE(SUM(pn.magnesium_mg   * si.quantity), 0),
			COALESCE(SUM(pn.potassium_mg   * si.quantity), 0)
		FROM sales s
		JOIN sales_items si         ON si.sales_id    = s.id
		JOIN products p             ON p.id           = si.products_id
		JOIN product_nutrition pn   ON pn.product_id  = p.id
		-- only include sales that have a completed or blocked ledger entry
		JOIN customers_ledger cl
			ON  cl.reference_id   = s.id
			AND cl.reference_type = 'purchase'
			AND cl.purchase_status IN ('completed', 'blocked')
			AND cl.user_id        = s.user_id
		WHERE s.user_id = $1
		  AND s.created_at >= DATE_TRUNC('day', NOW())
		  AND s.created_at <  DATE_TRUNC('day', NOW()) + INTERVAL '1 day'`

	var t NutritionTotals
	err = r.db.QueryRowContext(ctx, totalsQuery, userID).Scan(
		&t.CaloriesKcal,
		&t.ProteinG,
		&t.TotalFatG,
		&t.FiberG,
		&t.SugarG,
		&t.SodiumMg,
		&t.IronMg,
		&t.CalciumMg,
		&t.VitaminAMcg,
		&t.VitaminCMg,
		&t.VitaminEMg,
		&t.MagnesiumMg,
		&t.PotassiumMg,
	)
	if err != nil {
		return nil, fmt.Errorf("GetNutritionData totals query: %w", err)
	}

	return &NutritionResponse{
		Totals: t,
		Limits: limits,
	}, nil
}

// ── computeLimits ─────────────────────────────────────────────────────────────

// computeLimits derives user-specific daily nutrient limits.
// When weight or sex are unknown we fall back to neutral defaults so the UI
// always has something to display.
func computeLimits(birthDate time.Time, weightKG sql.NullFloat64, biologicalSex sql.NullString) NutritionLimits {
	now := time.Now()
	age := now.Year() - birthDate.Year()
	if now.YearDay() < birthDate.YearDay() {
		age--
	}

	weight := 60.0 // default fallback kg
	if weightKG.Valid && weightKG.Float64 > 0 {
		weight = weightKG.Float64
	}

	sex := "male" // default fallback
	if biologicalSex.Valid && biologicalSex.String != "" {
		sex = biologicalSex.String
	}

	// Calories: weight × 32.5 kcal (midpoint of 30–35)
	caloriesKcal := weight * 32.5

	// Protein: weight × 0.8 g
	proteinG := weight * 0.8

	// Total Fat: 20% of calories, divided by 9 kcal/g
	totalFatG := math.Round((caloriesKcal*0.20/9)*100) / 100

	// Fiber: flat 30 g
	fiberG := 30.0

	// Sugar: 36 g male / 25 g female
	sugarG := 36.0
	if sex == "female" {
		sugarG = 25.0
	}

	// Sodium: flat 2300 mg
	sodiumMg := 2300.0

	// Iron: flat 45 mg
	ironMg := 45.0

	// Calcium: 1000 mg all ages (per spec)
	calciumMg := 1000.0

	// Vitamin A: 900 mcg male / 700 mcg female
	vitaminAMcg := 900.0
	if sex == "female" {
		vitaminAMcg = 700.0
	}

	// Vitamin C: flat 115 mg
	vitaminCMg := 115.0

	// Vitamin E: age-dependent
	vitaminEMg := 15.0 // 14+
	if age <= 8 {
		vitaminEMg = 7.0
	} else if age <= 13 {
		vitaminEMg = 11.0
	}

	// Magnesium: flat 410 mg
	magnesiumMg := 410.0

	// Potassium: 2500 mg male / 2300 mg female
	potassiumMg := 2500.0
	if sex == "female" {
		potassiumMg = 2300.0
	}

	return NutritionLimits{
		CaloriesKcal: caloriesKcal,
		ProteinG:     proteinG,
		TotalFatG:    totalFatG,
		FiberG:       fiberG,
		SugarG:       sugarG,
		SodiumMg:     sodiumMg,
		IronMg:       ironMg,
		CalciumMg:    calciumMg,
		VitaminAMcg:  vitaminAMcg,
		VitaminCMg:   vitaminCMg,
		VitaminEMg:   vitaminEMg,
		MagnesiumMg:  magnesiumMg,
		PotassiumMg:  potassiumMg,
	}
}

// ── GetRecentPurchases ────────────────────────────────────────────────────────

func (r *postgresRepository) GetRecentPurchases(ctx context.Context, userID string) (*PurchasesResponse, error) {
	query := `
		SELECT
			s.id            AS sale_id,
			si.id           AS sale_item_id,
			p.product_name,
			p.image_url,
			st.stall_name,
			si.quantity,
			si.extended_price,
			s.created_at
		FROM sales s
		JOIN sales_items si  ON si.sales_id   = s.id
		JOIN products p      ON p.id          = si.products_id
		JOIN stalls st       ON st.id         = s.stall_id
		-- enforce completed or blocked ledger entries only
		JOIN customers_ledger cl
			ON  cl.reference_id   = s.id
			AND cl.reference_type = 'purchase'
			AND cl.purchase_status IN ('completed', 'blocked')
			AND cl.user_id        = s.user_id
		WHERE s.user_id = $1
		ORDER BY s.created_at DESC
		LIMIT 5`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("GetRecentPurchases query: %w", err)
	}
	defer rows.Close()

	items := []PurchaseItem{}
	for rows.Next() {
		var item PurchaseItem
		var imageURL sql.NullString
		var purchasedAt time.Time

		if err := rows.Scan(
			&item.SaleID,
			&item.SaleItemID,
			&item.ProductName,
			&imageURL,
			&item.StallName,
			&item.Quantity,
			&item.ExtendedPrice,
			&purchasedAt,
		); err != nil {
			return nil, fmt.Errorf("GetRecentPurchases scan: %w", err)
		}

		if imageURL.Valid {
			item.ImageURL = &imageURL.String
		}
		item.PurchasedAt = purchasedAt.Format(time.RFC3339)

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetRecentPurchases rows: %w", err)
	}

	return &PurchasesResponse{Items: items}, nil
}