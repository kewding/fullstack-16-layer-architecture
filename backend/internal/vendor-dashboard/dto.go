package vendordashboard

// ── Daily Net Profit Card ─────────────────────────────────────────────────────

// DailyProfitCard is the response for GET /vendor-auth/dashboard/daily-profit
type DailyProfitCard struct {
	// DailyGrossProfit is the sum of sales.total_amount for today for this vendor's stall.
	DailyGrossProfit float64 `json:"daily_gross_profit"`

	// MonthlyFeeTotal is the sum of all 4 active concession fee components for the current month.
	MonthlyFeeTotal float64 `json:"monthly_fee_total"`

	// BusinessDaysInMonth is the count of Mon–Fri days in the current calendar month.
	BusinessDaysInMonth int `json:"business_days_in_month"`

	// ProratedDailyFee is MonthlyFeeTotal / BusinessDaysInMonth.
	ProratedDailyFee float64 `json:"prorated_daily_fee"`

	// DailyNetProfit is DailyGrossProfit - ProratedDailyFee.
	DailyNetProfit float64 `json:"daily_net_profit"`

	// Date is today's date in YYYY-MM-DD format.
	Date string `json:"date"`
}

// ── Wallet Balance Card ───────────────────────────────────────────────────────

// WalletCard is the response for GET /vendor-auth/dashboard/wallet
type WalletCard struct {
	// Balance is the live wallet balance of this vendor.
	Balance float64 `json:"balance"`
}

// ── Top Selling Items ─────────────────────────────────────────────────────────

// TopSellingItem is a single row in the top-selling list.
type TopSellingItem struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	TotalQty    int     `json:"total_qty"`
	TotalRev    float64 `json:"total_revenue"`
	ImageURL    *string `json:"image_url"`
}

// TopSellingResponse is the response for GET /vendor-auth/dashboard/top-selling
type TopSellingResponse struct {
	Items []TopSellingItem `json:"items"`
}

// ── Top Rated Items ───────────────────────────────────────────────────────────

// TopRatedItem is a single row in the top-rated list.
type TopRatedItem struct {
	ProductID    string  `json:"product_id"`
	ProductName  string  `json:"product_name"`
	AvgRating    float64 `json:"avg_rating"`
	RatingCount  int     `json:"rating_count"`
	ImageURL     *string `json:"image_url"`
}

// TopRatedResponse is the response for GET /vendor-auth/dashboard/top-rated
type TopRatedResponse struct {
	Items []TopRatedItem `json:"items"`
}

// ── Allergen Intervention ─────────────────────────────────────────────────────

// AllergenCountResponse is the response for GET /vendor-auth/dashboard/allergen-count
type AllergenCountResponse struct {
	// Count is the number of allergen interventions for this vendor's stall in the last 7 days.
	Count int    `json:"count"`
	Since string `json:"since"` // ISO-8601 start of the 7-day window
}

// AllergenInterventionRow is a single row in the allergen table.
type AllergenInterventionRow struct {
	Time        string `json:"time"`         // ISO-8601
	ProductName string `json:"product_name"`
	Allergen    string `json:"allergen"`
}

// AllergenTableResponse is the response for GET /vendor-auth/dashboard/allergen-table
type AllergenTableResponse struct {
	Data []AllergenInterventionRow `json:"data"`
}