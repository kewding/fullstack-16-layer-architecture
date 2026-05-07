package dashboard

import (
	"context"
	"database/sql"
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

// ── helpers ───────────────────────────────────────────────────────────────────

func parseDateRange(req DateRangeRequest) (from, to time.Time, err error) {
	from, err = time.Parse("2006-01-02", req.DateFrom)
	if err != nil {
		return
	}
	to, err = time.Parse("2006-01-02", req.DateTo)
	if err != nil {
		return
	}
	// include full end day
	to = to.Add(24*time.Hour - time.Second)
	return
}

// currentWeekMonFri returns the Monday 00:00 and Friday 23:59:59 of the
// current ISO week in the server's local timezone.
func currentWeekMonFri() (monday, friday time.Time) {
	now := time.Now()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday → 7
	}
	monday = time.Date(now.Year(), now.Month(), now.Day()-(weekday-1), 0, 0, 0, 0, now.Location())
	friday = monday.AddDate(0, 0, 4).Add(24*time.Hour - time.Second)
	return
}

// ── GetStatCards ──────────────────────────────────────────────────────────────

func (r *postgresRepository) GetStatCards(ctx context.Context, req DateRangeRequest) (*StatCardsResponse, error) {
	from, to, err := parseDateRange(req)
	if err != nil {
		return nil, fmt.Errorf("GetStatCards parse date: %w", err)
	}

	res := &StatCardsResponse{}

	// 1. Allergen intervention count
	err = r.db.QueryRowContext(ctx, `
		SELECT COUNT(DISTINCT id)
		FROM allergen_interventions
		WHERE created_at BETWEEN $1 AND $2`,
		from, to,
	).Scan(&res.DailyAllergenCount)
	if err != nil {
		return nil, fmt.Errorf("GetStatCards allergen count: %w", err)
	}

	// 2. Total gross sales
	err = r.db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(total_amount), 0)
		FROM sales
		WHERE created_at BETWEEN $1 AND $2`,
		from, to,
	).Scan(&res.TotalGrossSales)
	if err != nil {
		return nil, fmt.Errorf("GetStatCards gross sales: %w", err)
	}

	// 3. Average NRF 9.3 across all transactions in range
	//    For each sale, sum nutrients across all items (qty × per-unit value),
	//    compute NRF9.3, then average over all sales.
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			COALESCE(SUM(si.quantity * pn.protein_g),       0),
			COALESCE(SUM(si.quantity * pn.fiber_g),         0),
			COALESCE(SUM(si.quantity * pn.vitamin_a_mcg),   0),
			COALESCE(SUM(si.quantity * pn.vitamin_c_mg),    0),
			COALESCE(SUM(si.quantity * pn.vitamin_e_mg),    0),
			COALESCE(SUM(si.quantity * pn.magnesium_mg),    0),
			COALESCE(SUM(si.quantity * pn.potassium_mg),    0),
			COALESCE(SUM(si.quantity * pn.iron_mg),         0),
			COALESCE(SUM(si.quantity * pn.calcium_mg),      0),
			COALESCE(SUM(si.quantity * pn.sugar_g),         0),
			COALESCE(SUM(si.quantity * pn.sodium_mg),       0),
			COALESCE(SUM(si.quantity * pn.saturated_fat_g), 0)
		FROM sales s
		JOIN sales_items si       ON si.sales_id   = s.id
		JOIN product_nutrition pn ON pn.product_id = si.products_id
		WHERE s.created_at BETWEEN $1 AND $2
		GROUP BY s.id`,
		from, to,
	)
	if err != nil {
		return nil, fmt.Errorf("GetStatCards NRF query: %w", err)
	}
	defer rows.Close()

	var totalScore float64
	var count int
	for rows.Next() {
		var (
			proteinG, fiberG, vitAMcg, vitCMg, vitEMg float64
			magMg, potMg, ironMg, calciumMg            float64
			sugarG, sodiumMg, satFatG                  float64
		)
		if err := rows.Scan(
			&proteinG, &fiberG, &vitAMcg, &vitCMg, &vitEMg,
			&magMg, &potMg, &ironMg, &calciumMg,
			&sugarG, &sodiumMg, &satFatG,
		); err != nil {
			return nil, fmt.Errorf("GetStatCards NRF scan: %w", err)
		}
		totalScore += NRF93(proteinG, fiberG, vitAMcg, vitCMg, vitEMg,
			magMg, potMg, ironMg, calciumMg, sugarG, sodiumMg, satFatG)
		count++
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetStatCards NRF rows: %w", err)
	}
	if count > 0 {
		res.DailyNQS = totalScore / float64(count)
	}

	return res, nil
}

// ── GetNQSTrend ───────────────────────────────────────────────────────────────

func (r *postgresRepository) GetNQSTrend(ctx context.Context) (*NQSTrendResponse, error) {
	monday, friday := currentWeekMonFri()

	// Pull per-sale nutrient totals for the whole week, with sale date
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			DATE(s.created_at)                                    AS sale_date,
			COALESCE(SUM(si.quantity * pn.protein_g),       0)   AS protein_g,
			COALESCE(SUM(si.quantity * pn.fiber_g),         0)   AS fiber_g,
			COALESCE(SUM(si.quantity * pn.vitamin_a_mcg),   0)   AS vitamin_a_mcg,
			COALESCE(SUM(si.quantity * pn.vitamin_c_mg),    0)   AS vitamin_c_mg,
			COALESCE(SUM(si.quantity * pn.vitamin_e_mg),    0)   AS vitamin_e_mg,
			COALESCE(SUM(si.quantity * pn.magnesium_mg),    0)   AS magnesium_mg,
			COALESCE(SUM(si.quantity * pn.potassium_mg),    0)   AS potassium_mg,
			COALESCE(SUM(si.quantity * pn.iron_mg),         0)   AS iron_mg,
			COALESCE(SUM(si.quantity * pn.calcium_mg),      0)   AS calcium_mg,
			COALESCE(SUM(si.quantity * pn.sugar_g),         0)   AS sugar_g,
			COALESCE(SUM(si.quantity * pn.sodium_mg),       0)   AS sodium_mg,
			COALESCE(SUM(si.quantity * pn.saturated_fat_g), 0)   AS saturated_fat_g
		FROM sales s
		JOIN sales_items si       ON si.sales_id   = s.id
		JOIN product_nutrition pn ON pn.product_id = si.products_id
		WHERE s.created_at BETWEEN $1 AND $2
		GROUP BY s.id, DATE(s.created_at)
		ORDER BY sale_date`,
		monday, friday,
	)
	if err != nil {
		return nil, fmt.Errorf("GetNQSTrend query: %w", err)
	}
	defer rows.Close()

	// Accumulate per-day: sum of NRF scores and count of transactions
	type dayAgg struct {
		total float64
		count int
	}
	dayMap := map[string]*dayAgg{}

	for rows.Next() {
		var saleDate time.Time
		var (
			proteinG, fiberG, vitAMcg, vitCMg, vitEMg float64
			magMg, potMg, ironMg, calciumMg            float64
			sugarG, sodiumMg, satFatG                  float64
		)
		if err := rows.Scan(
			&saleDate,
			&proteinG, &fiberG, &vitAMcg, &vitCMg, &vitEMg,
			&magMg, &potMg, &ironMg, &calciumMg,
			&sugarG, &sodiumMg, &satFatG,
		); err != nil {
			return nil, fmt.Errorf("GetNQSTrend scan: %w", err)
		}
		key := saleDate.Format("2006-01-02")
		if dayMap[key] == nil {
			dayMap[key] = &dayAgg{}
		}
		dayMap[key].total += NRF93(proteinG, fiberG, vitAMcg, vitCMg, vitEMg,
			magMg, potMg, ironMg, calciumMg, sugarG, sodiumMg, satFatG)
		dayMap[key].count++
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetNQSTrend rows: %w", err)
	}

	// Build Mon–Fri points (0 score for days with no data)
	points := make([]NQSTrendPoint, 0, 5)
	for i := 0; i < 5; i++ {
		day := monday.AddDate(0, 0, i)
		key := day.Format("2006-01-02")
		var score float64
		if agg, ok := dayMap[key]; ok && agg.count > 0 {
			score = agg.total / float64(agg.count)
		}
		points = append(points, NQSTrendPoint{Date: key, Score: score})
	}

	return &NQSTrendResponse{Points: points}, nil
}

// ── GetAllergenInterventions ──────────────────────────────────────────────────

func (r *postgresRepository) GetAllergenInterventions(ctx context.Context, req DateRangeRequest) (*AllergenInterventionsResponse, error) {
	from, to, err := parseDateRange(req)
	if err != nil {
		return nil, fmt.Errorf("GetAllergenInterventions parse date: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT
			ai.created_at,
			p.product_name,
			ai.allergen_matched,
			s.stall_name
		FROM allergen_interventions ai
		JOIN products p ON p.id = ai.product_id
		JOIN stalls   s ON s.id = ai.stall_id
		WHERE ai.created_at BETWEEN $1 AND $2
		ORDER BY ai.created_at DESC
		LIMIT 100`,
		from, to,
	)
	if err != nil {
		return nil, fmt.Errorf("GetAllergenInterventions query: %w", err)
	}
	defer rows.Close()

	data := []AllergenInterventionRow{}
	for rows.Next() {
		var row AllergenInterventionRow
		var createdAt time.Time
		if err := rows.Scan(&createdAt, &row.ProductName, &row.Allergen, &row.StallName); err != nil {
			return nil, fmt.Errorf("GetAllergenInterventions scan: %w", err)
		}
		row.Time = createdAt.Format(time.RFC3339)
		data = append(data, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetAllergenInterventions rows: %w", err)
	}

	return &AllergenInterventionsResponse{Data: data}, nil
}

// ── GetNutritionalTarget ──────────────────────────────────────────────────────

func (r *postgresRepository) GetNutritionalTarget(ctx context.Context, req DateRangeRequest) (*NutritionalTargetResponse, error) {
	from, to, err := parseDateRange(req)
	if err != nil {
		return nil, fmt.Errorf("GetNutritionalTarget parse date: %w", err)
	}

	var (
		proteinG, fiberG, vitAMcg, vitCMg, vitEMg float64
		magMg, potMg, ironMg, calciumMg            float64
		sugarG, sodiumMg, satFatG                  float64
	)

	err = r.db.QueryRowContext(ctx, `
		SELECT
			COALESCE(SUM(si.quantity * pn.protein_g),       0),
			COALESCE(SUM(si.quantity * pn.fiber_g),         0),
			COALESCE(SUM(si.quantity * pn.vitamin_a_mcg),   0),
			COALESCE(SUM(si.quantity * pn.vitamin_c_mg),    0),
			COALESCE(SUM(si.quantity * pn.vitamin_e_mg),    0),
			COALESCE(SUM(si.quantity * pn.magnesium_mg),    0),
			COALESCE(SUM(si.quantity * pn.potassium_mg),    0),
			COALESCE(SUM(si.quantity * pn.iron_mg),         0),
			COALESCE(SUM(si.quantity * pn.calcium_mg),      0),
			COALESCE(SUM(si.quantity * pn.sugar_g),         0),
			COALESCE(SUM(si.quantity * pn.sodium_mg),       0),
			COALESCE(SUM(si.quantity * pn.saturated_fat_g), 0)
		FROM sales s
		JOIN sales_items si       ON si.sales_id   = s.id
		JOIN product_nutrition pn ON pn.product_id = si.products_id
		WHERE s.created_at BETWEEN $1 AND $2`,
		from, to,
	).Scan(
		&proteinG, &fiberG, &vitAMcg, &vitCMg, &vitEMg,
		&magMg, &potMg, &ironMg, &calciumMg,
		&sugarG, &sodiumMg, &satFatG,
	)
	if err != nil {
		return nil, fmt.Errorf("GetNutritionalTarget query: %w", err)
	}

	nutrients := []NutrientBar{
		// Encouraged
		{Nutrient: "Protein",    PercentDV: proteinG / DVProteinG * 100,    IsLimited: false},
		{Nutrient: "Fiber",      PercentDV: fiberG / DVFiberG * 100,        IsLimited: false},
		{Nutrient: "Vitamin A",  PercentDV: vitAMcg / DVVitaminAMcg * 100,  IsLimited: false},
		{Nutrient: "Vitamin C",  PercentDV: vitCMg / DVVitaminCMg * 100,    IsLimited: false},
		{Nutrient: "Vitamin E",  PercentDV: vitEMg / DVVitaminEMg * 100,    IsLimited: false},
		{Nutrient: "Magnesium",  PercentDV: magMg / DVMagnesiumMg * 100,    IsLimited: false},
		{Nutrient: "Potassium",  PercentDV: potMg / DVPotassiumMg * 100,    IsLimited: false},
		{Nutrient: "Iron",       PercentDV: ironMg / DVIronMg * 100,        IsLimited: false},
		{Nutrient: "Calcium",    PercentDV: calciumMg / DVCalciumMg * 100,  IsLimited: false},
		// Limited
		{Nutrient: "Sugar",         PercentDV: sugarG / DVSugarG * 100,        IsLimited: true},
		{Nutrient: "Sodium",        PercentDV: sodiumMg / DVSodiumMg * 100,     IsLimited: true},
		{Nutrient: "Saturated Fat", PercentDV: satFatG / DVSaturatedFatG * 100, IsLimited: true},
	}

	return &NutritionalTargetResponse{Nutrients: nutrients}, nil
}

// ── GetRevenueDistribution ────────────────────────────────────────────────────

func (r *postgresRepository) GetRevenueDistribution(ctx context.Context, req DateRangeRequest) (*RevenueDistributionResponse, error) {
	from, to, err := parseDateRange(req)
	if err != nil {
		return nil, fmt.Errorf("GetRevenueDistribution parse date: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT
			s.stall_name,
			COALESCE(SUM(sa.total_amount), 0)                         AS gross_sales,
			v.concession_fee_type,
			v.concession_fee_value
		FROM stalls s
		JOIN vendors v  ON v.user_id = s.user_id
		LEFT JOIN sales sa ON sa.stall_id = s.id
			AND sa.created_at BETWEEN $1 AND $2
		WHERE s.deleted_at IS NULL
		GROUP BY s.stall_name, v.concession_fee_type, v.concession_fee_value
		ORDER BY gross_sales DESC`,
		from, to,
	)
	if err != nil {
		return nil, fmt.Errorf("GetRevenueDistribution query: %w", err)
	}
	defer rows.Close()

	var stalls []StallRevenueRow
	var totalGross float64

	for rows.Next() {
		var (
			stallName       string
			grossSales      float64
			feeType         sql.NullString
			feeValue        sql.NullFloat64
		)
		if err := rows.Scan(&stallName, &grossSales, &feeType, &feeValue); err != nil {
			return nil, fmt.Errorf("GetRevenueDistribution scan: %w", err)
		}

		var concessionFee float64
		if feeType.Valid && feeValue.Valid {
			switch feeType.String {
			case "percentage":
				concessionFee = grossSales * (feeValue.Float64 / 100)
			case "fixed":
				concessionFee = feeValue.Float64
			}
		}

		stalls = append(stalls, StallRevenueRow{
			StallName:     stallName,
			GrossSales:    grossSales,
			ConcessionFee: concessionFee,
			NetToVendor:   grossSales - concessionFee,
		})
		totalGross += grossSales
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetRevenueDistribution rows: %w", err)
	}

	return &RevenueDistributionResponse{Stalls: stalls, TotalGross: totalGross}, nil
}

// ── GetStallSettlement ────────────────────────────────────────────────────────

func (r *postgresRepository) GetStallSettlement(ctx context.Context) (*StallSettlementResponse, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			s.stall_name,
			COALESCE(SUM(sa.total_amount), 0)                             AS total_revenue,
			COALESCE(SUM(r.amount) FILTER (WHERE r.status = 'completed'), 0) AS remitted
		FROM stalls s
		LEFT JOIN sales      sa ON sa.stall_id  = s.id
		LEFT JOIN remittances r  ON r.user_id   = s.user_id
		WHERE s.deleted_at IS NULL
		GROUP BY s.stall_name
		ORDER BY s.stall_name`)
	if err != nil {
		return nil, fmt.Errorf("GetStallSettlement query: %w", err)
	}
	defer rows.Close()

	var stalls []StallSettlementRow
	for rows.Next() {
		var row StallSettlementRow
		if err := rows.Scan(&row.StallName, &row.TotalRevenue, &row.RemittedAmount); err != nil {
			return nil, fmt.Errorf("GetStallSettlement scan: %w", err)
		}
		row.RemainingBalance = row.TotalRevenue - row.RemittedAmount
		stalls = append(stalls, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetStallSettlement rows: %w", err)
	}

	return &StallSettlementResponse{Stalls: stalls}, nil
}