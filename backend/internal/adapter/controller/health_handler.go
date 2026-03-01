package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/usecase/service"
)

type HealthHandler struct {
	HealthService *service.HealthService
}

func (h *HealthHandler) Check(c *gin.Context) {
	if err := h.HealthService.ExecuteHealthCheck(c.Request.Context()); err != nil {
		c.String(http.StatusServiceUnavailable, "unhealthy")
		return
	}

	c.String(http.StatusOK, "ok")
}