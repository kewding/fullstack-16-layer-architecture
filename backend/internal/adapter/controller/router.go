package controller

import (
	"github.com/gin-gonic/gin"
	admintransactions "github.com/kewding/backend/internal/admin-transactions"
	"github.com/kewding/backend/internal/dashboard"
	"github.com/kewding/backend/internal/infra/db"
	"github.com/kewding/backend/internal/login"
	medicalinfo "github.com/kewding/backend/internal/medical-info"
	"github.com/kewding/backend/internal/middleware"
	"github.com/kewding/backend/internal/register"
	rfidtagging "github.com/kewding/backend/internal/rfid-tagging"
	topup "github.com/kewding/backend/internal/top-up"
	"github.com/kewding/backend/internal/user"
	vendorinfo "github.com/kewding/backend/internal/vendor-info"
	vendorinvite "github.com/kewding/backend/internal/vendor-invite"
	vendorregister "github.com/kewding/backend/internal/vendor-register"
	"github.com/kewding/backend/internal/vendors"
)

type Dependencies struct {
	RegisterController         *register.Controller
	LoginController            *login.Controller
	HealthHandler              *HealthHandler
	RfidTaggingController      *rfidtagging.Controller
	CreditTopupController      *topup.Controller
	UserInfoController         *user.Controller
	VendorInviteController     *vendorinvite.Controller
	VendorRegisterController   *vendorregister.Controller
	VendorController           *vendors.Controller
	VendorInfoController       *vendorinfo.Controller
	MedicalInfoController      *medicalinfo.Controller
	AdminTransactionController *admintransactions.Controller
	UserController             *user.Controller
	DashboardController        *dashboard.Controller
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
			admin.GET("/vendors/review", deps.VendorController.ListVendorsReview)
			admin.GET("/vendors/balance", deps.VendorController.ListVendorsBalance)
			admin.DELETE("/vendor/:id/revoke", deps.VendorInviteController.RevokeVendor)

			admin.GET("/vendor/:id", deps.VendorController.GetVendorDetail)
			admin.PATCH("/vendor/:id/approve", deps.VendorController.ApproveVendor)

			admin.GET("/notifications", deps.VendorController.GetNotifications)
			admin.GET("/notifications/unread-count", deps.VendorController.GetUnreadCount)
			admin.PATCH("/notifications/mark-read", deps.VendorController.MarkNotificationsRead)
			admin.GET("/notifications/ws", deps.VendorController.NotificationsWebSocket)

			admin.PATCH("/vendor/:id/remove-business", deps.VendorController.RemoveFromBusiness)

			admin.GET("/profile", deps.UserInfoController.GetAdminInfo)
			admin.PUT("/profile", deps.UserInfoController.UpdateAdminInfo)

			admin.GET("/transactions/vendors", deps.AdminTransactionController.ListVendorTransactions)
			admin.GET("/transactions/customers", deps.AdminTransactionController.ListCustomerTransactions)
			admin.GET("/transactions/purchase/:id", deps.AdminTransactionController.GetPurchaseDetail)

			admin.GET("/users/customers", deps.UserController.ListCustomers)
			admin.GET("/users/customer/:id", deps.UserController.GetCustomerDetail)
			admin.PATCH("/users/customer/:id/disable", deps.UserController.DisableCustomer)
			admin.PATCH("/users/customer/:id/reactivate", deps.UserController.ReactivateCustomer)

			admin.GET("/dashboard/stat-cards", deps.DashboardController.GetStatCards)
			admin.GET("/dashboard/nqs-trend", deps.DashboardController.GetNQSTrend)
			admin.GET("/dashboard/allergen-interventions", deps.DashboardController.GetAllergenInterventions)
			admin.GET("/dashboard/nutritional-target", deps.DashboardController.GetNutritionalTarget)
			admin.GET("/dashboard/revenue-distribution", deps.DashboardController.GetRevenueDistribution)
			admin.GET("/dashboard/stall-settlement", deps.DashboardController.GetStallSettlement)
			//
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
			customer.GET("/medical-info", deps.MedicalInfoController.GetMedicalInfo)
			customer.PUT("/medical-info", deps.MedicalInfoController.UpsertMedicalInfo)
		}

		// Vendor only — role_id: 3
		vendorAuth := api.Group("/vendor-auth")
		vendorAuth.Use(middleware.AuthMiddleware(loginRepo, 3))
		{
			// vendor authenticated endpoints go here as you build them
			vendorAuth.GET("/personal-info", deps.VendorInfoController.GetPersonalInfo)
			vendorAuth.PUT("/personal-info", deps.VendorInfoController.UpdatePersonalInfo)
			vendorAuth.GET("/business-info", deps.VendorInfoController.GetBusinessInfo)
			vendorAuth.PUT("/business-info", deps.VendorInfoController.UpsertBusinessInfo)
			vendorAuth.POST("/documents/:type", deps.VendorInfoController.UploadDocument)
		}

	}

	return r
}
