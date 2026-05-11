package vendors

import "errors"

var (
	ErrVendorNotFound    = errors.New("vendor not found")
	ErrAlreadyInBusiness = errors.New("vendor is already in business")
	ErrNotForReview      = errors.New("vendor is not in for_review status")
	ErrNotInBusiness     = errors.New("vendor is not in in_business status")
	ErrWalletNotZero     = errors.New("vendor wallet balance must be zero before graduation")
	ErrFormerVendorNotFound = errors.New("former vendor record not found")
)