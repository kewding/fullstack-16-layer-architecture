package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/infra/db"
	"github.com/kewding/backend/internal/login" // Import added
	"github.com/kewding/backend/internal/register"
)

type Dependencies struct {
	RegisterController *register.Controller
	LoginController    *login.Controller // Correctly included
}

func NewRouter(postgresNode *db.PostgresDB, deps *Dependencies) *gin.Engine {
	r := gin.Default()

	// --- Route Mapping ---
	api := r.Group("/api")
	{
		// Registration Group 
		reg := api.Group("/register")
		{
			reg.POST("/check-institutional-id", deps.RegisterController.CheckInstitutionalID)
			reg.POST("/check-email", deps.RegisterController.CheckEmail)
			reg.POST("/", deps.RegisterController.Register)
		}

		// Auth Group for Login
		auth := api.Group("/auth")
		{
			auth.POST("/login", deps.LoginController.Login)
		}
	}

	return r
}