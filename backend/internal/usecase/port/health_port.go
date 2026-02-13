package port

import "context"

// defines anything that can be pinged for health checks
type Pinger interface {
	Ping(ctx context.Context) error
}
