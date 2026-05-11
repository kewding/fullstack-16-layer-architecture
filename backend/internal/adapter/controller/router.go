package controller

import (
	"github.com/gin-gonic/gin"
	admintransactions "github.com/kewding/backend/internal/admin-transactions"
	concessionfees "github.com/kewding/backend/internal/concession-fees"
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
	vendorsledger "github.com/kewding/backend/internal/vendors-ledger"
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
	TopUpRequestController     *topup.Controller
	ConcessionFeesController   *concessionfees.Controller
	VendorLedgerController     *vendorsledger.Controller
}

func NewRouter(postgresNode *db.PostgresDB, deps *Dependencies) *gin.Engine {
	r := gin.Default()

	r.GET("/health/db", deps.HealthHandler.Check)

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
			// Invitations
			admin.POST("/vendor/invite", deps.VendorInviteController.SendInvite)

			// Vendor review list + actions
			admin.GET("/vendors/review", deps.VendorController.ListVendorsReview)
			admin.GET("/vendor/:id", deps.VendorController.GetVendorDetail)
			admin.PATCH("/vendor/:id/approve", deps.VendorController.ApproveVendor)

			// Revoke (invited / for_review) — persists reason; replaces old DELETE revoke
			admin.PATCH("/vendor/:id/revoke", deps.VendorController.RevokeVendorWithReason)

			// Balance / stalls tab
			admin.GET("/vendors/balance", deps.VendorController.ListVendorsBalance)

			// Wallet balance check (frontend guard before showing graduate modal)
			admin.GET("/vendor/:id/wallet-balance", deps.VendorController.GetVendorWalletBalance)

			// Graduate vendor (in_business → former_vendor archive)
			admin.PATCH("/vendor/:id/graduate", deps.VendorController.GraduateVendor)

			// Former vendors
			admin.GET("/former-vendors", deps.VendorController.ListFormerVendors)
			admin.GET("/former-vendor/:id", deps.VendorController.GetFormerVendorDetail)
			admin.GET("/former-vendor/:id/ledger-csv", deps.VendorController.DownloadFormerVendorLedgerCSV)

			// Notifications
			admin.GET("/notifications", deps.VendorController.GetNotifications)
			admin.GET("/notifications/unread-count", deps.VendorController.GetUnreadCount)
			admin.PATCH("/notifications/mark-read", deps.VendorController.MarkNotificationsRead)
			admin.GET("/notifications/ws", deps.VendorController.NotificationsWebSocket)

			// Admin profile
			admin.GET("/profile", deps.UserInfoController.GetAdminInfo)
			admin.PUT("/profile", deps.UserInfoController.UpdateAdminInfo)

			// Transactions
			admin.GET("/transactions/vendors", deps.AdminTransactionController.ListVendorTransactions)
			admin.GET("/transactions/customers", deps.AdminTransactionController.ListCustomerTransactions)
			admin.GET("/transactions/purchase/:id", deps.AdminTransactionController.GetPurchaseDetail)

			// Customers
			admin.GET("/users/customers", deps.UserController.ListCustomers)
			admin.GET("/users/customer/:id", deps.UserController.GetCustomerDetail)
			admin.PATCH("/users/customer/:id/disable", deps.UserController.DisableCustomer)
			admin.PATCH("/users/customer/:id/reactivate", deps.UserController.ReactivateCustomer)

			// Dashboard
			admin.GET("/dashboard/stat-cards", deps.DashboardController.GetStatCards)
			admin.GET("/dashboard/nqs-trend", deps.DashboardController.GetNQSTrend)
			admin.GET("/dashboard/allergen-interventions", deps.DashboardController.GetAllergenInterventions)
			admin.GET("/dashboard/nutritional-target", deps.DashboardController.GetNutritionalTarget)
			admin.GET("/dashboard/revenue-distribution", deps.DashboardController.GetRevenueDistribution)
			admin.GET("/dashboard/stall-settlement", deps.DashboardController.GetStallSettlement)

			// Concession fees
			admin.GET("/concession-fees", deps.ConcessionFeesController.GetFees)
			admin.POST("/concession-fees/:fee_type", deps.ConcessionFeesController.SetFee)
			admin.GET("/concession-fees/history", deps.ConcessionFeesController.GetFeeHistory)

			// Vendor ledger (admin view — any vendor by ID)
			admin.GET("/vendor/:id/ledger", deps.VendorLedgerController.GetLedger)
			admin.POST("/ledger/post-monthly", deps.VendorLedgerController.PostMonthly)
		}

		// Cashier only — role_id: 4
		cashier := api.Group("/cashier")
		cashier.Use(middleware.AuthMiddleware(loginRepo, 4))
		{
			cashier.POST("/tag/rfid-tagging", deps.RfidTaggingController.RfidTagging)
			cashier.POST("/credit/top-up", deps.CreditTopupController.CreditTopup)

			// Request-based top-up
			cashierTopUp := cashier.Group("/top-up")
			{
				cashierTopUp.GET("/requests", deps.TopUpRequestController.ListPendingRequests)
				cashierTopUp.GET("/user-detail/:user_id", deps.TopUpRequestController.GetUserDetailForCashier)
				cashierTopUp.PATCH("/request/:id/accept", deps.TopUpRequestController.AcceptRequest)
				cashierTopUp.PATCH("/request/:id/reject", deps.TopUpRequestController.RejectRequest)
				cashierTopUp.GET("/rejected", deps.TopUpRequestController.ListRejectedRequests)
				cashierTopUp.GET("/completed", deps.TopUpRequestController.ListCompletedRequests)
				cashierTopUp.GET("/pending-count", deps.TopUpRequestController.GetPendingCount)
				cashierTopUp.GET("/ws", deps.TopUpRequestController.CashierPendingWebSocket)
			}
		}

		// Customer only — role_id: 2
		customer := api.Group("/customer")
		customer.Use(middleware.AuthMiddleware(loginRepo, 2))
		{
			customer.GET("/user/info/:id", deps.UserInfoController.GetUser)
			customer.GET("/user/wallet/:id", deps.UserInfoController.GetWallet)
			customer.GET("/medical-info", deps.MedicalInfoController.GetMedicalInfo)
			customer.PUT("/medical-info", deps.MedicalInfoController.UpsertMedicalInfo)

			customer.GET("/user/profile", deps.UserController.GetUserProfile)
			customer.PUT("/user/profile", deps.UserController.UpdateUserProfile)

			// Top-up request flow
			customerTopUp := customer.Group("/top-up")
			{
				customerTopUp.POST("/request", deps.TopUpRequestController.SubmitRequest)
				customerTopUp.GET("/pending", deps.TopUpRequestController.GetPendingRequest)
				customerTopUp.DELETE("/request/:id", deps.TopUpRequestController.CancelRequest)
				customerTopUp.GET("/history", deps.TopUpRequestController.ListTopUpHistory)
			}

			// User notifications
			customerNotif := customer.Group("/notifications")
			{
				customerNotif.GET("/", deps.TopUpRequestController.GetUserNotifications)
				customerNotif.GET("/unread-count", deps.TopUpRequestController.GetUserUnreadCount)
				customerNotif.PATCH("/mark-read", deps.TopUpRequestController.MarkUserNotificationsRead)
				customerNotif.GET("/ws", deps.TopUpRequestController.UserNotificationsWebSocket)
			}
		}

		// Vendor only — role_id: 3
		vendorAuth := api.Group("/vendor-auth")
		vendorAuth.Use(middleware.AuthMiddleware(loginRepo, 3))
		{
			vendorAuth.GET("/personal-info", deps.VendorInfoController.GetPersonalInfo)
			vendorAuth.PUT("/personal-info", deps.VendorInfoController.UpdatePersonalInfo)
			vendorAuth.GET("/business-info", deps.VendorInfoController.GetBusinessInfo)
			vendorAuth.PUT("/business-info", deps.VendorInfoController.UpsertBusinessInfo)
			vendorAuth.POST("/documents/:type", deps.VendorInfoController.UploadDocument)

			vendorAuth.GET("/ledger", deps.VendorLedgerController.GetLedger)
		}
	}

	return r
}
