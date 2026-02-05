package main

import (
	"log"

	"github.com/kewding/backend/internal/config"
	"github.com/kewding/backend/internal/database"
)

func main() {
	cfg := config.Load()

	db, err := database.NewPostgres(cfg)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	defer db.Close()

	log.Println("PostgreSQL connected successfully")
}
