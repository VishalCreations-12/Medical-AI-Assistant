package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/medical-ai-assistant/backend/config"
	"github.com/medical-ai-assistant/backend/repositories/memory"
)

func TestHealthEndpoint(t *testing.T) {
	cfg := &config.Config{
		Env:       "test",
		Port:      "8080",
		JWTSecret: "test-secret-key-for-jwt-signing-only",
		CORSOrigins: []string{"http://localhost:3000"},
	}
	store := memory.NewStore()
	if err := memory.SeedDemoData(store); err != nil {
		t.Fatalf("seed: %v", err)
	}
	engine := Setup(cfg, store)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}
