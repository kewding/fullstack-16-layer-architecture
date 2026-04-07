package main

import (
	"log"
	"net/http"
	"time"

	"github.com/joho/godotenv"
	"github.com/kewding/backend/internal/adapter/controller"
	"github.com/kewding/backend/internal/config"
	"github.com/kewding/backend/internal/infra/db"
	"github.com/kewding/backend/internal/infra/health"
	"github.com/kewding/backend/internal/login"
	"github.com/kewding/backend/internal/register"
	rfidtagging "github.com/kewding/backend/internal/rfid-tagging"
	topup "github.com/kewding/backend/internal/top-up"
	"github.com/kewding/backend/internal/usecase/service"
	"github.com/kewding/backend/internal/user"
	"github.com/kewding/backend/internal/validation"
	vendorinvite "github.com/kewding/backend/internal/vendor-invite"
	vendorregister "github.com/kewding/backend/internal/vendor-register"
	"github.com/kewding/backend/internal/vendors"
)

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	validation.Init()
	cfg := config.LoadEnv()

	// temporary debug — remove after fixing
	log.Printf("SMTP_FROM_EMAIL: '%s'", cfg.SMTPFromEmail)
	log.Printf("SMTP_USERNAME: '%s'", cfg.SMTPUsername)
	log.Printf("SMTP_HOST: '%s'", cfg.SMTPHost)

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

	// --- Credit Top-up ---
	topupRepo := topup.NewPostgresRepository(dbNode.Connection)
	topupNotifier := topup.NewPrintNotifier()
	topupUsecase := topup.NewUseCase(topupRepo, topupNotifier)
	topupController := topup.NewController(topupUsecase)

	// --- User Info ---
	userRepo := user.NewPostgresRepository(dbNode.Connection)
	userUseCase := user.NewUseCase(userRepo)
	userController := user.NewController(userUseCase)

	// --- Vendor Status ---
	vendorInviteRepo := vendorinvite.NewPostgresRepository(dbNode.Connection)
	vendorInviteEmailSender := vendorinvite.NewGmailEmailSender(
		cfg.SMTPHost,
		cfg.SMTPPort,
		cfg.SMTPUsername,
		cfg.SMTPPassword,
		cfg.SMTPFromEmail,
	)
	vendorInviteUseCase := vendorinvite.NewUseCase(vendorInviteRepo, vendorInviteEmailSender)
	vendorInviteController := vendorinvite.NewController(vendorInviteUseCase)

	// --- Vendor Registration ---
	vendorRegisterRepo := vendorregister.NewPostgresRepository(dbNode.Connection)
	vendorRegisterUseCase := vendorregister.NewUseCase(vendorRegisterRepo)
	vendorRegisterController := vendorregister.NewController(vendorRegisterUseCase)

	// --- Vendor ---
	vendorRepo := vendors.NewPostgresRepository(dbNode.Connection)
	vendorUseCase := vendors.NewUseCase(vendorRepo)
	vendorController := vendors.NewController(vendorUseCase)

	// --- Dependency Injection ---
	deps := &controller.Dependencies{
		RegisterController:       registerController,
		LoginController:          loginController,
		HealthHandler:            healthHandler,
		RfidTaggingController:    rfidTaggingController,
		CreditTopupController:    topupController,
		UserInfoController:       userController,
		VendorInviteController:   vendorInviteController,
		VendorRegisterController: vendorRegisterController,
		VendorController:         vendorController,
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
