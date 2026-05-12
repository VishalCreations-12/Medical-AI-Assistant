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

type SupplierHandler struct {
	Suppliers repositories.SupplierRepository
}

type supplierBody struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Country string `json:"country"`
}

func (h *SupplierHandler) List(c *gin.Context) {
	items, err := h.Suppliers.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *SupplierHandler) Create(c *gin.Context) {
	var body supplierBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	s := &models.Supplier{
		ID:        uuid.NewString(),
		Name:      strings.TrimSpace(body.Name),
		Email:     strings.TrimSpace(body.Email),
		Phone:     strings.TrimSpace(body.Phone),
		Country:   strings.TrimSpace(body.Country),
		CreatedAt: time.Now().UTC(),
	}
	if err := h.Suppliers.Create(c.Request.Context(), s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, s)
}

func (h *SupplierHandler) Update(c *gin.Context) {
	id := c.Param("id")
	prev, err := h.Suppliers.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	var body supplierBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	s := *prev
	s.Name = strings.TrimSpace(body.Name)
	s.Email = strings.TrimSpace(body.Email)
	s.Phone = strings.TrimSpace(body.Phone)
	s.Country = strings.TrimSpace(body.Country)
	if err := h.Suppliers.Update(c.Request.Context(), &s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}

func (h *SupplierHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.Suppliers.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
