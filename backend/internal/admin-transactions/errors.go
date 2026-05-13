package admintransactions

import "errors"

var (
	ErrInternalServer = errors.New("internal server error")
	ErrInvalidParams  = errors.New("invalid transaction parameters")
)
//