package dashboard

// ── Daily value reference constants (FDA standard) ───────────────────────────
// Used for NRF 9.3 %DV calculations. All per-day values.
const (
	DVProteinG       = 50.0
	DVFiberG         = 28.0
	DVVitaminAMcg    = 900.0
	DVVitaminCMg     = 90.0
	DVVitaminEMg     = 15.0
	DVMagnesiumMg    = 420.0
	DVPotassiumMg    = 4700.0
	DVIronMg         = 18.0
	DVCalciumMg      = 1300.0
	DVSugarG         = 50.0  // FDA added sugars DV
	DVSodiumMg       = 2300.0
	DVSaturatedFatG  = 20.0
)

// cap %DV at 100 per nutrient per NRF 9.3 spec
func capDV(v float64) float64 {
	if v > 100 {
		return 100
	}
	return v
}

// NRF93 computes the NRF 9.3 score from raw nutrient totals (per-transaction).
func NRF93(
	proteinG, fiberG, vitAMcg, vitCMg, vitEMg,
	magMg, potMg, ironMg, calciumMg,
	sugarG, sodiumMg, satFatG float64,
) float64 {
	encouraged := capDV(proteinG/DVProteinG*100) +
		capDV(fiberG/DVFiberG*100) +
		capDV(vitAMcg/DVVitaminAMcg*100) +
		capDV(vitCMg/DVVitaminCMg*100) +
		capDV(vitEMg/DVVitaminEMg*100) +
		capDV(magMg/DVMagnesiumMg*100) +
		capDV(potMg/DVPotassiumMg*100) +
		capDV(ironMg/DVIronMg*100) +
		capDV(calciumMg/DVCalciumMg*100)

	limited := capDV(sugarG/DVSugarG*100) +
		capDV(sodiumMg/DVSodiumMg*100) +
		capDV(satFatG/DVSaturatedFatG*100)

	return encouraged - limited
}

// ── Stat cards ────────────────────────────────────────────────────────────────

type StatCardsResponse struct {
	DailyNQS               float64 `json:"daily_nqs"`
	DailyAllergenCount     int     `json:"daily_allergen_count"`
	TotalGrossSales        float64 `json:"total_gross_sales"`
}

// ── NQS Trend (current week Mon–Fri) ─────────────────────────────────────────

type NQSTrendPoint struct {
	Date  string  `json:"date"`  // YYYY-MM-DD
	Score float64 `json:"score"`
}

type NQSTrendResponse struct {
	Points []NQSTrendPoint `json:"points"`
}

// ── Allergen Interventions table ──────────────────────────────────────────────

type AllergenInterventionRow struct {
	Time        string `json:"time"`         // ISO-8601
	ProductName string `json:"product_name"`
	Allergen    string `json:"allergen"`
	StallName   string `json:"stall_name"`
}

type AllergenInterventionsResponse struct {
	Data []AllergenInterventionRow `json:"data"`
}

// ── Nutritional Target Status (diverging bar) ─────────────────────────────────

type NutrientBar struct {
	Nutrient   string  `json:"nutrient"`
	PercentDV  float64 `json:"percent_dv"`  // positive = encouraged, used as-is for diverging
	IsLimited  bool    `json:"is_limited"`  // true = limited nutrient (renders left/red side)
}

type NutritionalTargetResponse struct {
	Nutrients []NutrientBar `json:"nutrients"`
}

// ── Revenue distribution modal ────────────────────────────────────────────────

type StallRevenueRow struct {
	StallName      string  `json:"stall_name"`
	GrossSales     float64 `json:"gross_sales"`
	ConcessionFee  float64 `json:"concession_fee"`
	NetToVendor    float64 `json:"net_to_vendor"`
}

type RevenueDistributionResponse struct {
	Stalls     []StallRevenueRow `json:"stalls"`
	TotalGross float64           `json:"total_gross"`
}

// ── Stall Settlement Status (not date-range filtered) ────────────────────────

type StallSettlementRow struct {
	StallName        string  `json:"stall_name"`
	TotalRevenue     float64 `json:"total_revenue"`
	RemittedAmount   float64 `json:"remitted_amount"`
	RemainingBalance float64 `json:"remaining_balance"`
}

type StallSettlementResponse struct {
	Stalls []StallSettlementRow `json:"stalls"`
}

// ── Shared request type ───────────────────────────────────────────────────────

type DateRangeRequest struct {
	DateFrom string // YYYY-MM-DD
	DateTo   string // YYYY-MM-DD
}