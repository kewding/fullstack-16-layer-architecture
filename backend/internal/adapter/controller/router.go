package controller

import (
	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/infra/db"
	"github.com/kewding/backend/internal/login"
	"github.com/kewding/backend/internal/middleware"
	"github.com/kewding/backend/internal/register"
	rfidtagging "github.com/kewding/backend/internal/rfid-tagging"
	topup "github.com/kewding/backend/internal/top-up"
	"github.com/kewding/backend/internal/user"
	vendorinvite "github.com/kewding/backend/internal/vendor-invite"
	vendorregister "github.com/kewding/backend/internal/vendor-register"
)

type Dependencies struct {
	RegisterController       *register.Controller
	LoginController          *login.Controller
	HealthHandler            *HealthHandler
	RfidTaggingController    *rfidtagging.Controller
	CreditTopupController    *topup.Controller
	UserInfoController       *user.Controller
	VendorInviteController   *vendorinvite.Controller
	VendorRegisterController *vendorregister.Controller
}

func NewRouter(postgresNode *db.PostgresDB, deps *Dependencies) *gin.Engine {
	r := gin.Default()

	r.GET("/health/db", deps.HealthHandler.Check)

	// shared login repo for session middleware
	loginRepo := login.NewPostgresRepository(postgresNode.Connection)

	api := r.Group("/api")
	{
		// --- Public Routes ---
		reg := api.Group("/register")
		{
			reg.POST("/check-institutional-id", deps.RegisterController.CheckInstitutionalID)
			reg.POST("/check-email", deps.RegisterController.CheckEmail)
			reg.POST("/", deps.RegisterController.Register)
		}

		auth := api.Group("/auth")
		{
			auth.POST("/login", deps.LoginController.Login)
			auth.GET("/me", deps.LoginController.Me)
			auth.POST("/logout", deps.LoginController.Logout)
		}

		// Public vendor routes — unauthenticated vendor access
		vendor := api.Group("/vendor")
		{
			vendor.GET("/invite/validate", deps.VendorInviteController.ValidateToken)
			vendor.POST("/invite/resend", deps.VendorInviteController.ResendInvite)
			vendor.POST("/register", deps.VendorRegisterController.Register)
		}

		// --- Authenticated Routes ---
		// Admin only — role_id: 1
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(loginRepo, 1))
		{
			admin.POST("/vendor/invite", deps.VendorInviteController.SendInvite)
		}

		// Cashier only — role_id: 4
		cashier := api.Group("/cashier")
		cashier.Use(middleware.AuthMiddleware(loginRepo, 4))
		{
			cashier.POST("/tag/rfid-tagging", deps.RfidTaggingController.RfidTagging)
			cashier.POST("/credit/top-up", deps.CreditTopupController.CreditTopup)
		}

		// Customer only — role_id: 2
		customer := api.Group("/customer")
		customer.Use(middleware.AuthMiddleware(loginRepo, 2))
		{
			customer.GET("/user/info/:id", deps.UserInfoController.GetUser)
			customer.GET("/user/wallet/:id", deps.UserInfoController.GetWallet)
		}
	}

	return r
}
