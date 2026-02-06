package main

import (
	"log"
	"net/http"

	"github.com/kewding/backend/internal/config"
	"github.com/kewding/backend/internal/database"
	"github.com/kewding/backend/internal/server"
)

func main() {
	cfg := config.Load()

	db, err := database.NewPostgres(cfg)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	defer db.Close()

	handler := server.NewServer(db)

	log.Println("API listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
