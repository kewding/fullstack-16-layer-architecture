package db

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/kewding/backend/internal/config"
	_ "github.com/lib/pq"
)

// typedefinition
type PostgresDB struct {
	Connection *sql.DB
}

// func Function_Name(var package.type) ()
func Connect(cfg config.Config) (*PostgresDB, error) {
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

	// connection pool tuning (important)
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	// ping verifies connection early
	if err := sqlDB.Ping(); err != nil {
		return nil, err
	}

	return &PostgresDB{Connection: sqlDB}, nil
}

func (database *PostgresDB) Close() error {
	return database.Connection.Close()
}
