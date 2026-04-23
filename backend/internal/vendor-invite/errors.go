package vendorinvite

import (
	"errors"
)

var (
	ErrInviteNotFound   = errors.New("invitation not found")
	ErrInviteExpired    = errors.New("invitation has expired")
	ErrInviteUsed       = errors.New("invitation has already been used")
	ErrEmailAlreadyUsed = errors.New("email already has a pending invitation")
	ErrCannotRevoke      = errors.New("vendor cannot be revoked at this stage")
	ErrEmailAlreadyRegistered = errors.New("email already belongs to a registered user")
)