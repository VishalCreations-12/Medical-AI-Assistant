package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/medical-ai-assistant/backend/services"
)

type InsightsHandler struct {
	Svc *services.InsightsService
}

func (h *InsightsHandler) Get(c *gin.Context) {
	b, err := h.Svc.Generate(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, b)
}
