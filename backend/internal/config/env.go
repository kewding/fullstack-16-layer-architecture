package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port       string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	SMTPHost        string
	SMTPPort        int
	SMTPUsername    string
	SMTPPassword    string
	SMTPFromEmail   string
}

func LoadEnv() *Config {
	port, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))
	return &Config{
		Port:          getEnv("APP_PORT", "8080"),
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "5432"),
		DBUser:        getEnv("DB_USER", "test"),
		DBPassword:    getEnv("DB_PASSWORD", "test"),
		DBName:        getEnv("DB_NAME", "test"),
		DBSSLMode:     getEnv("DB_SSLMODE", "disable"),
		SMTPHost:      getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:      port,
		SMTPUsername:  getEnv("SMTP_USERNAME", ""),
		SMTPPassword:  getEnv("SMTP_PASSWORD", ""),
		SMTPFromEmail: getEnv("SMTP_FROM_EMAIL", ""),
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
