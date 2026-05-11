package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/joho/godotenv"
	"github.com/kewding/backend/internal/adapter/controller"
	admintransactions "github.com/kewding/backend/internal/admin-transactions"
	concessionfees "github.com/kewding/backend/internal/concession-fees"
	"github.com/kewding/backend/internal/config"
	"github.com/kewding/backend/internal/dashboard"
	"github.com/kewding/backend/internal/infra/cleanup"
	"github.com/kewding/backend/internal/infra/cloudinary"
	"github.com/kewding/backend/internal/infra/db"
	"github.com/kewding/backend/internal/infra/health"
	"github.com/kewding/backend/internal/jobs"
	"github.com/kewding/backend/internal/login"
	medicalinfo "github.com/kewding/backend/internal/medical-info"
	"github.com/kewding/backend/internal/register"
	rfidtagging "github.com/kewding/backend/internal/rfid-tagging"
	topup "github.com/kewding/backend/internal/top-up"
	"github.com/kewding/backend/internal/usecase/service"
	"github.com/kewding/backend/internal/user"
	"github.com/kewding/backend/internal/validation"
	vendorinfo "github.com/kewding/backend/internal/vendor-info"
	vendorinvite "github.com/kewding/backend/internal/vendor-invite"
	vendorregister "github.com/kewding/backend/internal/vendor-register"
	"github.com/kewding/backend/internal/vendors"
	vendorsledger "github.com/kewding/backend/internal/vendors-ledger"
)

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	validation.Init()
	cfg := config.LoadEnv()

	dbNode, err := db.Connect(*cfg)
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}
	defer dbNode.Close()

	// --- Health Module Wiring ---

	dbHealthChecker := &health.DatabaseHealthChecker{
		Database: dbNode,
	}

	healthService := &service.HealthService{
		HealthCheckProvider: dbHealthChecker,
	}

	healthHandler := &controller.HealthHandler{
		HealthService: healthService,
	}

	// --- Background Cleanup Job ---
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cleaner := cleanup.NewExpiredInvitesCleaner(dbNode.Connection)
	go cleaner.Run(ctx)

	// --- Registration Module Wiring ---
	registerRepo := register.NewPostgresRepository(dbNode.Connection)
	registerUseCase := register.NewUseCase(registerRepo)
	registerController := register.NewController(registerUseCase)

	// --- Login Module Wiring ---
	loginRepo := login.NewPostgresRepository(dbNode.Connection)
	loginUseCase := login.NewUseCase(loginRepo)
	loginController := login.NewController(loginUseCase)

	// --- RFID Tagging ---
	rfidTaggingRepo := rfidtagging.NewPostgresRepository(dbNode.Connection)
	rfidTaggingUseCase := rfidtagging.NewUseCase(rfidTaggingRepo)
	rfidTaggingController := rfidtagging.NewController(rfidTaggingUseCase)

	// --- Credit Top-up --- Old direct top-up (kept while old cashier flow still exists)
	// topupRepo := topup.NewPostgresRepository(dbNode.Connection)
	// topupNotifier := topup.NewPrintNotifier()
	// topupUsecase := topup.NewUseCase(topupRepo, topupNotifier)
	// topupController := topup.NewController(topupUsecase)

	// --- User Info ---
	userRepo := user.NewPostgresRepository(dbNode.Connection)
	userUseCase := user.NewUseCase(userRepo)

	// --- Vendor Status ---
	vendorInviteRepo := vendorinvite.NewPostgresRepository(dbNode.Connection)
	vendorInviteEmailSender := vendorinvite.NewGmailEmailSender(
		cfg.SMTPHost,
		cfg.SMTPPort,
		cfg.SMTPUsername,
		cfg.SMTPPassword,
		cfg.SMTPFromEmail,
		cfg.AppURL,
	)
	vendorInviteUseCase := vendorinvite.NewUseCase(vendorInviteRepo, vendorInviteEmailSender)
	vendorInviteController := vendorinvite.NewController(vendorInviteUseCase)

	// --- Vendor ---
	vendorRepo := vendors.NewPostgresRepository(dbNode.Connection)
	vendorUseCase := vendors.NewUseCase(vendorRepo)
	vendorController := vendors.NewController(vendorUseCase, vendorInviteEmailSender)

	// --- Vendor Registration ---
	vendorRegisterRepo := vendorregister.NewPostgresRepository(dbNode.Connection)
	vendorRegisterUseCase := vendorregister.NewUseCase(
		vendorRegisterRepo,
		vendorRepo,
	)
	vendorRegisterController := vendorregister.NewController(vendorRegisterUseCase)

	// --- Vendor Info ---
	cloudUploader, err := cloudinary.NewUploader(
		cfg.CloudinaryCloud,
		cfg.CloudinaryKey,
		cfg.CloudinarySecret,
	)
	if err != nil {
		log.Fatalf("Failed to initialize Cloudinary uploader: %v", err)
	}

	vendorInfoRepo := vendorinfo.NewPostgresRepository(dbNode.Connection)
	vendorInfoUseCase := vendorinfo.NewUseCase(vendorInfoRepo, cloudUploader)
	vendorInfoController := vendorinfo.NewController(vendorInfoUseCase)

	// --- Medical Info ---
	medicalInfoRepo := medicalinfo.NewPostgresRepository(dbNode.Connection)
	medicalInfoUseCase := medicalinfo.NewUseCase(medicalInfoRepo)
	medicalInfoController := medicalinfo.NewController(medicalInfoUseCase)

	// --- Admin Transactions Table ---
	adminTxRepo := admintransactions.NewPostgresRepository(dbNode.Connection)
	adminTxUseCase := admintransactions.NewUseCase(adminTxRepo)
	adminTxController := admintransactions.NewController(adminTxUseCase)

	// --- Admin Dashboard ---
	dashboardRepo := dashboard.NewPostgresRepository(dbNode.Connection)
	dashboardUseCase := dashboard.NewUseCase(dashboardRepo)
	dashboardController := dashboard.NewController(dashboardUseCase)

	// --- Top-up request (new request-based flow) ---
	topUpRequestRepo := topup.NewPostgresRepository(dbNode.Connection)
	topUpRequestUseCase := topup.NewUseCase(topUpRequestRepo, topup.NewPrintNotifier())
	topUpRequestController := topup.NewController(topUpRequestUseCase)

	// --- Concession Fees ---
	concessionFeesRepo := concessionfees.NewPostgresRepository(dbNode.Connection)
	concessionFeesUseCase := concessionfees.NewUseCase(concessionFeesRepo)
	concessionFeesController := concessionfees.NewControllerWithNotifier(
		concessionFeesUseCase,
		vendorUseCase,
	)

	// --- User Controller (needs vendorUseCase for notifications) ---
	userController := user.NewControllerWithNotifier(userUseCase, vendorUseCase)

	// --- Vendors Ledger ---
	vendorLedgerRepo := vendorsledger.NewPostgresRepository(dbNode.Connection)
	vendorLedgerUseCase := vendorsledger.NewUseCase(vendorLedgerRepo)
	vendorLedgerController := vendorsledger.NewController(vendorLedgerUseCase)

	// --- Fee Scheduler (background job) ---
	adminEmailProvider := jobs.NewAdminEmailProvider(dbNode.Connection)
	feeScheduler := jobs.NewFeeScheduler(
		concessionFeesUseCase,
		vendorLedgerUseCase,
		vendorUseCase,           // already wired — implements NotificationWriter via CreateNotification
		vendorInviteEmailSender, // already wired — add SendFeeReminderEmail method (see below)
		adminEmailProvider,
	)
	go feeScheduler.Run(ctx)

	// --- Dependency Injection ---
	deps := &controller.Dependencies{
		RegisterController:    registerController,
		LoginController:       loginController,
		HealthHandler:         healthHandler,
		RfidTaggingController: rfidTaggingController,
		// CreditTopupController:      topupController,
		UserInfoController:         userController,
		VendorInviteController:     vendorInviteController,
		VendorRegisterController:   vendorRegisterController,
		VendorController:           vendorController,
		VendorInfoController:       vendorInfoController,
		MedicalInfoController:      medicalInfoController,
		AdminTransactionController: adminTxController,
		UserController:             userController,
		DashboardController:        dashboardController,
		TopUpRequestController:     topUpRequestController,
		ConcessionFeesController:   concessionFeesController,
		VendorLedgerController:     vendorLedgerController,
	}

	appRouter := controller.NewRouter(dbNode, deps)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      appRouter,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Server starting on port %s...", cfg.Port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed: %v", err)
	}
}
