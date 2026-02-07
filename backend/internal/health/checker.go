package health

import (
	"context"

	"github.com/kewding/backend/internal/database"
)

type Checker struct {
	DB *database.DB
}

func (c *Checker) Check(ctx context.Context) error {
	if err := c.DB.Ping(ctx); err != nil {
		return err
	}
	return nil
}
