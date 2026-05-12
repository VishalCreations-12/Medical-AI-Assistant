package main

import (
	"log"

	"github.com/medical-ai-assistant/backend/config"
	"github.com/medical-ai-assistant/backend/repositories/memory"
	"github.com/medical-ai-assistant/backend/routes"
)

func main() {
	cfg := config.Load()
	store := memory.NewStore()
	if err := memory.SeedDemoData(store); err != nil {
		log.Fatalf("seed: %v", err)
	}

	engine := routes.Setup(cfg, store)

	addr := ":" + cfg.Port
	log.Printf("Medical AI Assistant API listening on %s", addr)
	if err := engine.Run(addr); err != nil {
		log.Fatalf("server: %v", err)
	}
}
