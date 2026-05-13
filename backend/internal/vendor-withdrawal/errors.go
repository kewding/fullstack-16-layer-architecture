package vendorwithdrawal

import "errors"

var (
	ErrPendingRequestExists  = errors.New("a vendor withdrawal request is already pending")
	ErrInsufficientBalance   = errors.New("insufficient vendor wallet balance")
	ErrRequestNotFound       = errors.New("vendor withdrawal request not found")
	ErrNotPending            = errors.New("vendor withdrawal request is not in pending status")
	ErrInvalidRejectionInput = errors.New("comment is required when rejection reason is 'other'")
	ErrAmountExceedsBalance  = errors.New("withdrawal amount exceeds current vendor wallet balance")
	ErrVendorNotFound        = errors.New("vendor not found for this user")
)