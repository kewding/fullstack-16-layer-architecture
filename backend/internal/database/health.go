package database

import (
	"context"
	"time"
)

func (db *DB) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	return db.sql.PingContext(ctx)
}
