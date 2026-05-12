package topup

import (
	"errors"
)

var (
	ErrRfidUnregistered      = errors.New("rfid unregistered")
	ErrInsufficientBalance   = errors.New("insufficient wallet balance")
	ErrPendingRequestExists  = errors.New("you already have a pending top-up request")
	ErrRequestNotFound       = errors.New("top-up request not found")
	ErrNotPending            = errors.New("this request is no longer pending")
	ErrWalletLimitExceeded   = errors.New("this top-up would exceed the maximum wallet balance of ₱50,000")
	ErrUnauthorized          = errors.New("you are not authorized to perform this action")
	ErrInvalidRejectionInput = errors.New("a comment is required when rejection reason is 'other'")
)
