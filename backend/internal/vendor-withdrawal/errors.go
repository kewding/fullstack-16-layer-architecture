package vendorwithdrawal

import "errors"

var (
	// ErrVendorNotFound is returned when no active vendor row exists for the user.
	ErrVendorNotFound = errors.New("vendor not found")

	// ErrPendingRequestExists is returned when the vendor already has a pending request.
	ErrPendingRequestExists = errors.New("a pending withdrawal request already exists")

	// ErrAmountExceedsBalance is returned when the requested amount exceeds wallet balance.
	ErrAmountExceedsBalance = errors.New("withdrawal amount exceeds current wallet balance")

	// ErrRequestNotFound is returned when the request ID does not exist.
	ErrRequestNotFound = errors.New("withdrawal request not found")

	// ErrNotPending is returned when an action requires the request to be pending.
	ErrNotPending = errors.New("request is not in pending status")

	// ErrInsufficientBalance is returned when completing a request would push balance negative.
	ErrInsufficientBalance = errors.New("insufficient wallet balance to complete withdrawal")

	// ErrInvalidRejectionInput is returned when "other" reason has no comment.
	ErrInvalidRejectionInput = errors.New("comment is required when rejection reason is 'other'")

	// ErrMinimumAmount is returned when amount < 1.
	ErrMinimumAmount = errors.New("minimum withdrawal amount is ₱1.00")
)