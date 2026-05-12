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

type ProductHandler struct {
	Products repositories.ProductRepository
	Stock    repositories.StockEventRepository
}

type productBody struct {
	Name              string     `json:"name" binding:"required"`
	SKU               string     `json:"sku" binding:"required"`
	CategoryID        string     `json:"categoryId" binding:"required"`
	StockQuantity     int        `json:"stockQuantity"`
	LowStockThreshold int        `json:"lowStockThreshold"`
	UnitPrice         float64    `json:"unitPrice"`
	ExpiryDate        *time.Time `json:"expiryDate"`
}

func (h *ProductHandler) List(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	cat := strings.TrimSpace(c.Query("categoryId"))
	var low *bool
	if v := strings.TrimSpace(c.Query("lowStock")); v != "" {
		b := v == "true" || v == "1"
		low = &b
	}
	var exp *bool
	if v := strings.TrimSpace(c.Query("expiring")); v != "" {
		b := v == "true" || v == "1"
		exp = &b
	}
	items, err := h.Products.List(c.Request.Context(), repositories.ProductFilter{
		Query: q, CategoryID: cat, LowStock: low, Expiring: exp,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var body productBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	now := time.Now().UTC()
	p := &models.Product{
		ID:                uuid.NewString(),
		Name:              strings.TrimSpace(body.Name),
		SKU:               strings.TrimSpace(body.SKU),
		CategoryID:        body.CategoryID,
		StockQuantity:     body.StockQuantity,
		LowStockThreshold: body.LowStockThreshold,
		UnitPrice:         body.UnitPrice,
		ExpiryDate:        body.ExpiryDate,
		CreatedAt:         now,
		UpdatedAt:         now,
	}
	if err := h.Products.Create(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_ = h.Stock.Append(c.Request.Context(), p.ID, p.StockQuantity, "initial stock")
	c.JSON(http.StatusCreated, p)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id := c.Param("id")
	prev, err := h.Products.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	var body productBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	p := *prev
	p.Name = strings.TrimSpace(body.Name)
	p.SKU = strings.TrimSpace(body.SKU)
	p.CategoryID = body.CategoryID
	delta := body.StockQuantity - p.StockQuantity
	p.StockQuantity = body.StockQuantity
	p.LowStockThreshold = body.LowStockThreshold
	p.UnitPrice = body.UnitPrice
	p.ExpiryDate = body.ExpiryDate
	p.UpdatedAt = time.Now().UTC()
	if err := h.Products.Update(c.Request.Context(), &p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if delta != 0 {
		reason := "adjustment"
		if delta > 0 {
			reason = "restock"
		}
		_ = h.Stock.Append(c.Request.Context(), p.ID, delta, reason)
	}
	c.JSON(http.StatusOK, p)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.Products.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *ProductHandler) Get(c *gin.Context) {
	id := c.Param("id")
	p, err := h.Products.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}
