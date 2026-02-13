package controller

import (
	"net/http"

	"github.com/kewding/backend/internal/usecase/service"
)

type HealthHandler struct {
	HealthService *service.HealthService //VariableName *path_reference.struct
}

func (handler *HealthHandler) ServeHTTP(writer http.ResponseWriter, request *http.Request) {
	if err := handler.HealthService.ExecuteHealthCheck(request.Context()); err != nil {
		http.Error(writer, "unhealthy", http.StatusServiceUnavailable)
		return
	}

	writer.WriteHeader(http.StatusOK)
	writer.Write([]byte("ok"))
}
