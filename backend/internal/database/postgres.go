package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/kewding/backend/internal/config"
	_ "github.com/lib/pq"
)

// typedefinition
type DB struct {
	sql *sql.DB
}

func NewPostgres(cfg config.Config) (*DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBSSLMode,
	)

	sqlDB, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	// Connection pool tuning (important)
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	// Verify connection early
	if err := sqlDB.Ping(); err != nil {
		return nil, err
	}

	return &DB{sql: sqlDB}, nil
}

func (db *DB) Close() error {
	return db.sql.Close()
}
