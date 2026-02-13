package service

import (
	"context"

	"github.com/kewding/backend/internal/usecase/port"
)

type HealthService struct {
	HealthCheckProvider port.Pinger
}

func (service *HealthService) ExecuteHealthCheck(ctx context.Context) error {
	if err := service.HealthCheckProvider.Ping(ctx); err != nil {
		return err
	}
	return nil
}
