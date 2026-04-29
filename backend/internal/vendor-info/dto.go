package vendorinfo

type PersonalInfoRequest struct {
	FirstName     string `json:"first_name"  validate:"required,max=100"`
	MiddleName    string `json:"middle_name"  validate:"required,max=100"`
	LastName      string `json:"last_name"    validate:"required,max=100"`
	BirthDate     string `json:"birth_date"   validate:"required"`
	ContactNumber string `json:"contact_number" validate:"required"`
	StallName     string `json:"stall_name"   validate:"required,max=255"`
}

type PersonalInfoResponse struct {
	FirstName     string `json:"first_name"`
	MiddleName    string `json:"middle_name"`
	LastName      string `json:"last_name"`
	BirthDate     string `json:"birth_date"`
	ContactNumber string `json:"contact_number"`
	StallName     string `json:"stall_name"`
}

type BusinessInfoRequest struct {
	DtiSecNumber string `json:"dti_sec_number"`
	Tin          string `json:"tin"`
}

type BusinessInfoResponse struct {
	DtiSecNumber              string  `json:"dti_sec_number"`
	Tin                       string  `json:"tin"`
	ProofOfBusinessAddressURL *string `json:"proof_of_business_address_url"`
	BarangayClearanceURL      *string `json:"barangay_clearance_url"`
	MayorsPermitURL           *string `json:"mayors_permit_url"`
	IsDtiVerified             bool    `json:"is_dti_verified"`
	IsTinVerified             bool    `json:"is_tin_verified"`
	IsDocumentsVerified       bool    `json:"is_documents_verified"`
}