package main

import (
	"log"
	"net/http"
	"time"

	"github.com/kewding/backend/internal/adapter/controller"
	"github.com/kewding/backend/internal/config"
	"github.com/kewding/backend/internal/infra/db"
)

func main() {
	//load config
	cfg := config.LoadEnv()

	dbNode, err := db.Connect(*cfg)
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}
	defer dbNode.Close()

	//pass dbNode to router
	appRouter := controller.NewRouter(dbNode)

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
