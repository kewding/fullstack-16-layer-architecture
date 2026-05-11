package concessionfees

// FeeType is the discriminated key for each of the 4 fee components.
type FeeType string

const (
	FeeTypeUtilityCharges          FeeType = "utility_charges"
	FeeTypeMaintenanceRent         FeeType = "maintenance_rent"
	FeeTypeInsuranceAdministrative FeeType = "insurance_administrative"
	FeeTypePerformanceSecurity     FeeType = "performance_security"
)

// AllFeeTypes lists all valid fee types in display order.
var AllFeeTypes = []FeeType{
	FeeTypeUtilityCharges,
	FeeTypeMaintenanceRent,
	FeeTypeInsuranceAdministrative,
	FeeTypePerformanceSecurity,
}

// FeeComponentState describes the current and pending state of one fee component.
type FeeComponentState struct {
	// CurrentMonthAmount is the fee value active in the current billing month.
	CurrentMonthAmount float64 `json:"current_month_amount"`
	// NextMonthAmount is non-nil when the admin has already set a value for next month.
	NextMonthAmount *float64 `json:"next_month_amount"`
	// Locked is true when a next-month row already exists,
	// meaning the admin cannot change it again until the 1st of next month.
	Locked bool `json:"locked"`
	// LockedUntil is the ISO date of the 1st of the month after next (when it unlocks).
	// Only populated when Locked == true.
	LockedUntil *string `json:"locked_until,omitempty"`
	// EffectiveMonth is the calendar month the CurrentMonthAmount applies to (YYYY-MM-DD).
	EffectiveMonth string `json:"effective_month"`
}

// GetFeesResponse is the full response for GET /admin/concession-fees.
type GetFeesResponse struct {
	UtilityCharges          FeeComponentState `json:"utility_charges"`
	MaintenanceRent         FeeComponentState `json:"maintenance_rent"`
	InsuranceAdministrative FeeComponentState `json:"insurance_administrative"`
	PerformanceSecurity     FeeComponentState `json:"performance_security"`
	// TotalCurrentMonth is the sum of all 4 current-month fees.
	TotalCurrentMonth float64 `json:"total_current_month"`
	// TotalNextMonth is the sum of all 4 next-month fees (using current if next is nil).
	TotalNextMonth float64 `json:"total_next_month"`
}

// SetFeeRequest is the body for POST /admin/concession-fees/:fee_type.
type SetFeeRequest struct {
	Amount float64 `json:"amount" validate:"gte=0"`
}

// SetFeeResponse is returned after a successful fee update.
type SetFeeResponse struct {
	FeeType        FeeType `json:"fee_type"`
	Amount         float64 `json:"amount"`
	EffectiveMonth string  `json:"effective_month"` // the next month's 1st day
}

// FeeRow is a raw DB row from concession_fee_settings.
type FeeRow struct {
	ID             string
	FeeType        FeeType
	Amount         float64
	EffectiveMonth string // YYYY-MM-DD (always 1st of month)
}

// FeeHistoryRow is a single row in the fee change audit trail.
type FeeHistoryRow struct {
	ID             string  `json:"id"`
	FeeType        FeeType `json:"fee_type"`
	Amount         float64 `json:"amount"`
	EffectiveMonth string  `json:"effective_month"` // YYYY-MM-DD
	SetByUserID    string  `json:"set_by_user_id"`
	SetByName      string  `json:"set_by_name"`     // first + last name of the admin
	CreatedAt      string  `json:"created_at"`      // ISO-8601
}

type FeeHistoryResponse struct {
	Data []FeeHistoryRow `json:"data"`
}