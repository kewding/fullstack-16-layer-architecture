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
)

func main() {
	validation.Init()

	//load config
	cfg := config.LoadEnv()

	dbNode, err := db.Connect(*cfg)
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}
	defer dbNode.Close()

	registerRepo := register.NewPostgresRepository(dbNode.Connection)
	registerUseCase := register.NewUseCase(registerRepo)
	registerController := register.NewController(registerUseCase)

	//all controllers in the Dependencies struct
	deps := &controller.Dependencies{
        RegisterController: registerController,
    }

	//pass dbNode to router
	appRouter := controller.NewRouter(dbNode, deps)

	//configure http server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      appRouter,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	//start
	log.Printf("Server starting on port %s...", cfg.Port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed: %v", err)
	}

	
}
