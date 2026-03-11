package rfidtagging

import (
	"errors"
)

var (
	ErrUuidNotFound = errors.New("user uuid not found")
	ErrRfidPresent = errors.New("user already has an rfid tag")
	ErrRfidTaken = errors.New("rfid tag is already taken")
	ErrRfidTaggingFailed = errors.New("rfid tagging failed")
)