package vendorinvite

import (
	"errors"
)

var (
	ErrInviteNotFound   = errors.New("invitation not found")
	ErrInviteExpired    = errors.New("invitation has expired")
	ErrInviteUsed       = errors.New("invitation has already been used")
	ErrEmailAlreadyUsed = errors.New("email already has a pending invitation")
)