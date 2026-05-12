package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/medical-ai-assistant/backend/models"
	"github.com/medical-ai-assistant/backend/repositories"
)

type CategoryHandler struct {
	Categories repositories.CategoryRepository
}

type categoryBody struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

func (h *CategoryHandler) List(c *gin.Context) {
	items, err := h.Categories.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *CategoryHandler) Create(c *gin.Context) {
	var body categoryBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cat := &models.Category{
		ID:          uuid.NewString(),
		Name:        strings.TrimSpace(body.Name),
		Description: strings.TrimSpace(body.Description),
		CreatedAt:   time.Now().UTC(),
	}
	if err := h.Categories.Create(c.Request.Context(), cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cat)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id := c.Param("id")
	prev, err := h.Categories.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	var body categoryBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cat := *prev
	cat.Name = strings.TrimSpace(body.Name)
	cat.Description = strings.TrimSpace(body.Description)
	if err := h.Categories.Update(c.Request.Context(), &cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cat)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.Categories.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
