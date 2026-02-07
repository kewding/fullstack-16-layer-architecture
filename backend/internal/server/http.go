package server

import (
	"net/http"

	"github.com/kewding/backend/internal/database"
	"github.com/kewding/backend/internal/health"
	"github.com/kewding/backend/internal/server/handlers"
)

func NewServer(db *database.DB) http.Handler {
	mux := http.NewServeMux()

	checker := &health.Checker{DB: db}
	HealthHandler := &handlers.HealthHandler{Checker: checker}
	mux.Handle("/health/db", HealthHandler)
	return mux
}
