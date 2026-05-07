package user

import "errors"

var (
	ErrUserNotFound   = errors.New("user not found")
	ErrWalletNotFound = errors.New("wallet not found")
)
