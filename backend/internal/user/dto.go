package user

import "errors"

var (
	ErrUserNotFound   = errors.New("user not found")
	ErrWalletNotFound = errors.New("wallet not found")
)

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
}