package concessionfees

import "errors"

var (
	// ErrInvalidFeeType is returned when the fee_type path param is not one of the 4 valid types.
	ErrInvalidFeeType = errors.New("invalid fee type")

	// ErrFeeAlreadySetForNextMonth is returned when the admin tries to set a fee
	// that already has a row for next month (i.e. locked until the 1st of next month).
	ErrFeeAlreadySetForNextMonth = errors.New("fee already set for next month")
)