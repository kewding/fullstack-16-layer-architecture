package register

type CheckInstitutionalIDRequest struct {
	InstitutionalID string `json:"institutionalId" validate:"required,min=5,max=50"`
}

type CheckEmailRequest struct {
	Email string `json:"email" validate:"required,email,max=255"`
}

type RegisterRequest struct {
	InstitutionalID string `json:"institutionalId" validate:"required,min=5,max=50"`
	Email           string `json:"email" validate:"required,email,max=255"`
	ContactNumber   string `json:"contactNumber" validate:"required,min=11,max=11"`
	FirstName       string `json:"firstName" validate:"required,min=1,max=100"`
	MiddleName      string `json:"middleName" validate:"required,min=1,max=100"`
	LastName        string `json:"lastName" validate:"required,min=1,max=100"`
	BirthDate       string `json:"birthDate" validate:"required,datetime=2006-01-02"`
	Password        string `json:"password" validate:"required,min=8,max=100"`
	// Role         string `json:"role"`
	// RfidTag      string `json:"rfidTag"`
}
