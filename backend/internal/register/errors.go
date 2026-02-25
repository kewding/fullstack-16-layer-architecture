package register

import (
	"errors"
)

var (
    ErrInstitutionalIDNotFound     = errors.New("institutional ID not found")
    ErrInstitutionalIDAlreadyTaken = errors.New("institutional ID is already linked to another user") // New
    ErrEmailAlreadyExists          = errors.New("email already exists")
    ErrRegistrationFailed          = errors.New("registration failed")
)
