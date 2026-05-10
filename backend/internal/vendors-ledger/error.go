package vendorsledger

import "errors"

var (
	// ErrAlreadyPosted is returned when a monthly gross_profit or concession_fee
	// entry already exists for the given vendor + billing_month.
	ErrAlreadyPosted = errors.New("ledger already posted for this billing month")

	// ErrVendorNotFound is returned when the vendor_id does not exist.
	ErrVendorNotFound = errors.New("vendor not found")

	// ErrInsufficientBalance is returned when a remittance debit would push the
	// net balance below zero.
	ErrInsufficientBalance = errors.New("insufficient vendor balance for this entry")
)