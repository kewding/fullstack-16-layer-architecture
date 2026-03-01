package login

import (
	"errors"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrAuthenticationFailed = errors.New("authentication failed")
)