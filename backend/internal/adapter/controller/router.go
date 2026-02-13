package controller

import (
	"net/http"

	"github.com/kewding/backend/internal/infra/db"
	"github.com/kewding/backend/internal/infra/health"
	"github.com/kewding/backend/internal/usecase/service"
)

func NewRouter(postgresNode *db.PostgresDB) http.Handler {
	mux := http.NewServeMux()

	checkerNode := &health.DatabaseHealthChecker{
		Database: postgresNode,
	}

	healthService := &service.HealthService{
		HealthCheckProvider: checkerNode,
	}

	healthHandler := &HealthHandler{
		HealthService: healthService,
	}

	mux.Handle("/health/db", healthHandler)
	return mux
}
