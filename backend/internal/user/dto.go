package user

type GetUserResponse struct {
	UserID     string `json:"user_id"`
	FirstName  string `json:"first_name"`
	MiddleName string `json:"middle_name"`
	LastName   string `json:"last_name"`
}

type WalletResponse struct {
	Balance         float64  `json:"balance"`
	LastTopupAmount *float64 `json:"last_topup_amount"`
	LastTopupDate   *string  `json:"last_topup_date"`
}

type UpdateAdminInfoRequest struct {
	FirstName     string `json:"first_name"  validate:"required,max=100"`
	MiddleName    string `json:"middle_name"  validate:"required,max=100"`
	LastName      string `json:"last_name"    validate:"required,max=100"`
	BirthDate     string `json:"birth_date"   validate:"required"`
	ContactNumber string `json:"contact_number" validate:"required"`
}

type AdminInfoResponse struct {
	FirstName     string `json:"first_name"`
	MiddleName    string `json:"middle_name"`
	LastName      string `json:"last_name"`
	BirthDate     string `json:"birth_date"`
	ContactNumber string `json:"contact_number"`
	Email         string `json:"email"`
}

// ── Customer list ─────────────────────────────────────────────────────────────

type CustomerRole string

const (
	CustomerRoleStudent CustomerRole = "student"
	CustomerRoleTeacher CustomerRole = "teacher"
	CustomerRoleFaculty CustomerRole = "faculty"
)

// CustomerRow is a single row returned by the list endpoints.
type CustomerRow struct {
	UserID       string       `json:"user_id"`
	InstID       string       `json:"inst_id"`
	FirstName    string       `json:"first_name"`
	MiddleName   string       `json:"middle_name"`
	LastName     string       `json:"last_name"`
	CustomerRole CustomerRole `json:"customer_role"`
	CreatedAt    string       `json:"created_at"` // ISO-8601; used for "Date Registered"
	DeletedAt    *string      `json:"deleted_at"` // non-nil only in inactive list
}

type ListCustomersRequest struct {
	Page     int    // 1-based
	Limit    int    // rows per page
	Search   string // partial name match
	DateFrom string // YYYY-MM-DD, optional
	DateTo   string // YYYY-MM-DD, optional
	Active   bool   // true → active list, false → inactive list
}

type ListCustomersResponse struct {
	Data       []CustomerRow `json:"data"`
	Total      int           `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
}

// ── Customer detail (modal) ───────────────────────────────────────────────────

type CustomerDetailResponse struct {
	// Personal
	UserID       string       `json:"user_id"`
	InstID       string       `json:"inst_id"`
	Email        string       `json:"email"`
	FirstName    string       `json:"first_name"`
	MiddleName   string       `json:"middle_name"`
	LastName     string       `json:"last_name"`
	BirthDate    string       `json:"birth_date"`
	ContactNo    string       `json:"contact_no"`
	CustomerRole CustomerRole `json:"customer_role"`
	CreatedAt    string       `json:"created_at"`

	// RFID
	RFIDTag      *string `json:"rfid_tag"`
	RFIDIsActive *bool   `json:"rfid_is_active"`

	// Medical
	BloodType                    *string  `json:"blood_type"`
	HeightCM                     *float64 `json:"height_cm"`
	WeightKG                     *float64 `json:"weight_kg"`
	Allergens                    []string `json:"allergens"`
	CustomAllergens              []string `json:"custom_allergens"`
	MedicalConditions            []string `json:"medical_conditions"`
	Medications                  []string `json:"medications"`
	EmergencyContactName         *string  `json:"emergency_contact_name"`
	EmergencyContactNumber       *string  `json:"emergency_contact_number"`
	EmergencyContactRelationship *string  `json:"emergency_contact_relationship"`
}

type UserProfileResponse struct {
	FirstName     string `json:"first_name"`
	MiddleName    string `json:"middle_name"`
	LastName      string `json:"last_name"`
	BirthDate     string `json:"birth_date"`
	ContactNumber string `json:"contact_number"`
	CustomerRole  string `json:"customer_role"` // "student" | "teacher" | "faculty" | ""
	Email         string `json:"email"`
}

type UpdateUserProfileRequest struct {
	FirstName     string `json:"first_name"     validate:"required,max=100"`
	MiddleName    string `json:"middle_name"     validate:"required,max=100"`
	LastName      string `json:"last_name"       validate:"required,max=100"`
	BirthDate     string `json:"birth_date"      validate:"required"`
	ContactNumber string `json:"contact_number"  validate:"required"`
	CustomerRole  string `json:"customer_role"   validate:"required,oneof=student teacher faculty"`
}
