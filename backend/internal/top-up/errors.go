package topup

import (
	"errors"
)

var (
	ErrRfidUnregistered = errors.New("rfid unregistered")
	ErrInsufficientBalance = errors.New("insufficient wallet balance")
)