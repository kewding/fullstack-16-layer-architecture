package withdrawal

import "errors"

var (
	ErrPendingRequestExists  = errors.New("a withdrawal request is already pending")
	ErrInsufficientBalance   = errors.New("insufficient wallet balance")
	ErrRequestNotFound       = errors.New("withdrawal request not found")
	ErrNotPending            = errors.New("withdrawal request is not in pending status")
	ErrInvalidRejectionInput = errors.New("comment is required when rejection reason is 'other'")
	ErrAmountExceedsBalance  = errors.New("withdrawal amount exceeds current wallet balance")
)