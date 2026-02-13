package health

import (
	"context"
	"time"

	"github.com/kewding/backend/internal/infra/db"
)

type DatabaseHealthChecker struct {
	Database *db.PostgresDB
}

func (checker *DatabaseHealthChecker) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	return checker.Database.Connection.PingContext(ctx)
}
