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