package vendorregister

import "errors"

var (
	ErrInviteInvalid = errors.New("invitation is invalid, expired, or already used")
	ErrEmailExists   = errors.New("an account with this email already exists")
)