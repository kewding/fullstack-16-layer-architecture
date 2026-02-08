package handlers

import (
	"net/http"

	"github.com/kewding/backend/internal/health"
)

type HealthHandler struct {
	Checker *health.Checker //VariableName *path_reference.struct
}

func (h *HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if err := h.Checker.Check(r.Context()); err != nil {
		http.Error(w, "unhealthy", http.StatusServiceUnavailable)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("ok"))
}
