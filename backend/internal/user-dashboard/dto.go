package userdashboard

// ── Nutrition ─────────────────────────────────────────────────────────────────

// NutritionLimits holds the user-specific daily recommended limits
// derived from weight, age, and biological sex.
type NutritionLimits struct {
	CaloriesKcal float64 `json:"calories_kcal"`
	ProteinG     float64 `json:"protein_g"`
	TotalFatG    float64 `json:"total_fat_g"`
	FiberG       float64 `json:"fiber_g"`
	SugarG       float64 `json:"sugar_g"`
	SodiumMg     float64 `json:"sodium_mg"`
	IronMg       float64 `json:"iron_mg"`
	CalciumMg    float64 `json:"calcium_mg"`
	VitaminAMcg  float64 `json:"vitamin_a_mcg"`
	VitaminCMg   float64 `json:"vitamin_c_mg"`
	VitaminEMg   float64 `json:"vitamin_e_mg"`
	MagnesiumMg  float64 `json:"magnesium_mg"`
	PotassiumMg  float64 `json:"potassium_mg"`
}

// NutritionTotals holds the summed intake for today (calendar day, midnight-to-midnight).
type NutritionTotals struct {
	CaloriesKcal float64 `json:"calories_kcal"`
	ProteinG     float64 `json:"protein_g"`
	TotalFatG    float64 `json:"total_fat_g"`
	FiberG       float64 `json:"fiber_g"`
	SugarG       float64 `json:"sugar_g"`
	SodiumMg     float64 `json:"sodium_mg"`
	IronMg       float64 `json:"iron_mg"`
	CalciumMg    float64 `json:"calcium_mg"`
	VitaminAMcg  float64 `json:"vitamin_a_mcg"`
	VitaminCMg   float64 `json:"vitamin_c_mg"`
	VitaminEMg   float64 `json:"vitamin_e_mg"`
	MagnesiumMg  float64 `json:"magnesium_mg"`
	PotassiumMg  float64 `json:"potassium_mg"`
}

// NutritionResponse is the full payload returned by GET /customer/dashboard/nutrition.
type NutritionResponse struct {
	Totals NutritionTotals `json:"totals"`
	Limits NutritionLimits `json:"limits"`
}

// ── Purchases ─────────────────────────────────────────────────────────────────

// PurchaseItem represents one sales_item row shown on the dashboard.
type PurchaseItem struct {
	SaleID       string  `json:"sale_id"`
	SaleItemID   string  `json:"sale_item_id"`
	ProductName  string  `json:"product_name"`
	ImageURL     *string `json:"image_url"`
	StallName    string  `json:"stall_name"`
	Quantity     int     `json:"quantity"`
	ExtendedPrice float64 `json:"extended_price"`
	PurchasedAt  string  `json:"purchased_at"` // ISO-8601
}

// PurchasesResponse is the full payload returned by GET /customer/dashboard/purchases.
type PurchasesResponse struct {
	Items []PurchaseItem `json:"items"`
}