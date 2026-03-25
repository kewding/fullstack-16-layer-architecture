package vendorregister

type VendorRegisterRequest struct {
	Token         string `json:"token" validate:"required"`
	BusinessName  string `json:"business_name" validate:"required,min=2,max=255"`
	FirstName     string `json:"first_name" validate:"required,max=100"`
	MiddleName    string `json:"middle_name" validate:"required,max=100"`
	LastName      string `json:"last_name" validate:"required,max=100"`
	BirthDate     string `json:"birth_date" validate:"required"`
	ContactNumber string `json:"contact_number" validate:"required"`
	Password      string `json:"password" validate:"required,min=8,max=100"`
}