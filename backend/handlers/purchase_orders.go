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

type PurchaseOrderHandler struct {
	Orders    repositories.PurchaseOrderRepository
	Suppliers repositories.SupplierRepository
	Products  repositories.ProductRepository
}

type poBody struct {
	SupplierID   string                      `json:"supplierId" binding:"required"`
	Status       models.PurchaseOrderStatus  `json:"status"`
	Lines        []models.PurchaseOrderLine  `json:"lines" binding:"required,min=1"`
	Notes        string                      `json:"notes"`
	ExpectedDate *time.Time                  `json:"expectedDate"`
}

func (h *PurchaseOrderHandler) List(c *gin.Context) {
	items, err := h.Orders.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *PurchaseOrderHandler) Create(c *gin.Context) {
	var body poBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sup, err := h.Suppliers.GetByID(c.Request.Context(), body.SupplierID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "supplier not found"})
		return
	}
	if body.Status == "" {
		body.Status = models.StatusDraft
	}
	lines := make([]models.PurchaseOrderLine, 0, len(body.Lines))
	var total float64
	for _, ln := range body.Lines {
		pid := ln.ProductID
		pname := ln.ProductName
		if pname == "" && pid != "" {
			if pr, err := h.Products.GetByID(c.Request.Context(), pid); err == nil {
				pname = pr.Name
			}
		}
		line := models.PurchaseOrderLine{
			ID: uuid.NewString(), ProductID: pid, Quantity: ln.Quantity, UnitCost: ln.UnitCost, ProductName: pname,
		}
		lines = append(lines, line)
		total += float64(ln.Quantity) * ln.UnitCost
	}
	now := time.Now().UTC()
	po := &models.PurchaseOrder{
		ID:           uuid.NewString(),
		SupplierID:   sup.ID,
		SupplierName: sup.Name,
		Status:       body.Status,
		Lines:        lines,
		Notes:        strings.TrimSpace(body.Notes),
		TotalAmount:  total,
		ExpectedDate: body.ExpectedDate,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := h.Orders.Create(c.Request.Context(), po); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, po)
}

func (h *PurchaseOrderHandler) Update(c *gin.Context) {
	id := c.Param("id")
	prev, err := h.Orders.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	var body poBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sup, err := h.Suppliers.GetByID(c.Request.Context(), body.SupplierID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "supplier not found"})
		return
	}
	po := *prev
	po.SupplierID = sup.ID
	po.SupplierName = sup.Name
	po.Status = body.Status
	po.Notes = strings.TrimSpace(body.Notes)
	po.ExpectedDate = body.ExpectedDate
	lines := make([]models.PurchaseOrderLine, 0, len(body.Lines))
	var total float64
	for _, ln := range body.Lines {
		pid := ln.ProductID
		pname := ln.ProductName
		if pname == "" && pid != "" {
			if pr, err := h.Products.GetByID(c.Request.Context(), pid); err == nil {
				pname = pr.Name
			}
		}
		lid := ln.ID
		if lid == "" {
			lid = uuid.NewString()
		}
		line := models.PurchaseOrderLine{
			ID: lid, ProductID: pid, Quantity: ln.Quantity, UnitCost: ln.UnitCost, ProductName: pname,
		}
		lines = append(lines, line)
		total += float64(ln.Quantity) * ln.UnitCost
	}
	po.Lines = lines
	po.TotalAmount = total
	po.UpdatedAt = time.Now().UTC()
	if err := h.Orders.Update(c.Request.Context(), &po); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, po)
}

func (h *PurchaseOrderHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.Orders.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *PurchaseOrderHandler) Get(c *gin.Context) {
	id := c.Param("id")
	po, err := h.Orders.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, po)
}
