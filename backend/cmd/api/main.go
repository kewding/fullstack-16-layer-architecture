package main

import (
	"log"
	"net/http"
	"time"

	"github.com/kewding/backend/internal/adapter/controller"
	"github.com/kewding/backend/internal/config"
	"github.com/kewding/backend/internal/infra/db"
	"github.com/kewding/backend/internal/validation"
	"github.com/kewding/backend/internal/register"
	"github.com/kewding/backend/internal/login"
)

func main() {
	validation.Init() // [4]
	cfg := config.LoadEnv()

	dbNode, err := db.Connect(*cfg)
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}
	defer dbNode.Close()

	// --- Registration Module Wiring [5] ---
	registerRepo := register.NewPostgresRepository(dbNode.Connection)
	registerUseCase := register.NewUseCase(registerRepo)
	registerController := register.NewController(registerUseCase)

	// --- Login Module Wiring ---
	loginRepo := login.NewPostgresRepository(dbNode.Connection)
	loginUseCase := login.NewUseCase(loginRepo)
	loginController := login.NewController(loginUseCase)

	// --- Dependency Injection ---
	deps := &controller.Dependencies{
        RegisterController: registerController,
        LoginController:    loginController, // Add login controller to deps
    }

	appRouter := controller.NewRouter(dbNode, deps)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      appRouter,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Server starting on port %s...", cfg.Port) // [6]
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed: %v", err)
	}
}