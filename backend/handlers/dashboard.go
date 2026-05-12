package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/medical-ai-assistant/backend/services"
)

type DashboardHandler struct {
	Svc *services.DashboardService
}

func (h *DashboardHandler) Summary(c *gin.Context) {
	s, err := h.Svc.Summary(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}
