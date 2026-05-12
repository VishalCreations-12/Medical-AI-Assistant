package config

import (
	"os"
	"strconv"
)

type Config struct {
	Env           string
	Port          string
	JWTSecret     string
	CORSOrigins   []string
	FileStorePath string
}

func Load() *Config {
	port := getenv("PORT", "8080")
	secret := getenv("JWT_SECRET", "dev-secret-change-in-production-min-32-chars-long")
	origins := getenv("CORS_ORIGINS", "http://localhost:3000")
	path := getenv("FILE_STORE_PATH", "./data/app-state.json")

	return &Config{
		Env:           getenv("ENV", "development"),
		Port:          port,
		JWTSecret:     secret,
		CORSOrigins:   splitOrigins(origins),
		FileStorePath: path,
	}
}

func getenv(key, fallback string) string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return v
}

func GetBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}

func splitOrigins(s string) []string {
	if s == "" {
		return []string{"http://localhost:3000"}
	}
	out := make([]string, 0)
	start := 0
	for i := 0; i <= len(s); i++ {
		if i == len(s) || s[i] == ',' {
			part := trimSpace(s[start:i])
			if part != "" {
				out = append(out, part)
			}
			start = i + 1
		}
	}
	if len(out) == 0 {
		return []string{"http://localhost:3000"}
	}
	return out
}

func trimSpace(s string) string {
	i, j := 0, len(s)
	for i < j && (s[i] == ' ' || s[i] == '\t') {
		i++
	}
	for i < j && (s[j-1] == ' ' || s[j-1] == '\t') {
		j--
	}
	return s[i:j]
}
