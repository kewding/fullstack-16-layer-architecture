package user

import "errors"

var ErrUserNotFound = errors.New("user not found")

type GetUserResponse struct {
	UserID     string `json:"user_id"`
	FirstName  string `json:"first_name"`
	MiddleName string `json:"middle_name"`
	LastName   string `json:"last_name"`
}