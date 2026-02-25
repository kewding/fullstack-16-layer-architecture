package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/infra/db"
	"github.com/kewding/backend/internal/infra/health"
	"github.com/kewding/backend/internal/register"
	"github.com/kewding/backend/internal/usecase/service"
)

// groups all your controllers into one struct
// add more features (Auth, Profile, etc.)
type Dependencies struct {
	RegisterController *register.Controller
}

func NewRouter(postgresNode *db.PostgresDB, deps *Dependencies) *gin.Engine {
	r := gin.Default()

	// --- Infrastructure / Health Logic ---
	checkerNode := &health.DatabaseHealthChecker{
		Database: postgresNode,
	}

	healthService := &service.HealthService{
		HealthCheckProvider: checkerNode,
	}

	// Assuming HealthHandler is updated to Gin, or used as a standard handler
	healthHandler := &HealthHandler{
		HealthService: healthService,
	}

	// --- Route Mapping ---
	
	// Health Check (Standard GET)
	r.GET("/health/db", func(c *gin.Context) {
		healthHandler.ServeHTTP(c.Writer, c.Request)
	})

	// Registration Group
	api := r.Group("/api")
	{
		reg := api.Group("/register")
		{
			// These match the methods in your register.Controller
			reg.POST("/check-institutional-id", deps.RegisterController.CheckInstitutionalID)
			reg.POST("/check-email", deps.RegisterController.CheckEmail)
			reg.POST("/", deps.RegisterController.Register)
		}
	}

	return r
}