package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/infra/db"
	"github.com/kewding/backend/internal/login"
	"github.com/kewding/backend/internal/register"
	rfidtagging "github.com/kewding/backend/internal/rfid-tagging"
	topup "github.com/kewding/backend/internal/top-up"
	"github.com/kewding/backend/internal/user"
)

type Dependencies struct {
	RegisterController    *register.Controller
	LoginController       *login.Controller
	HealthHandler         *HealthHandler
	RfidTaggingController *rfidtagging.Controller
	CreditTopupController *topup.Controller
	UserInfoController    *user.Controller
}

func NewRouter(postgresNode *db.PostgresDB, deps *Dependencies) *gin.Engine {
	r := gin.Default()

	r.GET("/health/db", deps.HealthHandler.Check)

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
			auth.GET("/me", deps.LoginController.Me)
		}

		//Tagging Group for rfid
		tag := api.Group("/tag")
		{
			tag.POST("/rfid-tagging", deps.RfidTaggingController.RfidTagging)
		}

		//Top-up Group
		topup := api.Group("/credit")
		{
			topup.POST("/top-up", deps.CreditTopupController.CreditTopup)
		}

		userinfo := api.Group("/user")
		{
			userinfo.GET("/:id", deps.UserInfoController.GetUser)
		}
	}

	return r
}
