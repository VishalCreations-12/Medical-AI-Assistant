package services

import (
	"context"
	"sort"
	"time"

	"github.com/medical-ai-assistant/backend/models"
	"github.com/medical-ai-assistant/backend/repositories"
)

type DashboardService struct {
	Products repositories.ProductRepository
	Orders   repositories.PurchaseOrderRepository
	Categories repositories.CategoryRepository
}

type MonthlyPoint struct {
	Month string  `json:"month"`
	Value float64 `json:"value"`
}

type CategorySlice struct {
	Category string  `json:"category"`
	Value    float64 `json:"value"`
}

type DashboardSummary struct {
	InventoryValue    float64         `json:"inventoryValue"`
	SKUCount          int             `json:"skuCount"`
	LowStockCount     int             `json:"lowStockCount"`
	ExpiringSoonCount int             `json:"expiringSoonCount"`
	OpenOrders        int             `json:"openOrders"`
	MonthlySpend      []MonthlyPoint  `json:"monthlySpend"`
	CategoryMix       []CategorySlice `json:"categoryMix"`
	RevenueEstimate   float64         `json:"revenueEstimate"`
}

func (s *DashboardService) Summary(ctx context.Context) (*DashboardSummary, error) {
	prods, err := s.Products.List(ctx, repositories.ProductFilter{})
	if err != nil {
		return nil, err
	}
	cats, err := s.Categories.List(ctx)
	if err != nil {
		return nil, err
	}
	catName := map[string]string{}
	for _, c := range cats {
		catName[c.ID] = c.Name
	}
	orders, err := s.Orders.List(ctx)
	if err != nil {
		return nil, err
	}

	var inventoryValue float64
	low := 0
	expSoon := 0
	now := time.Now().UTC()
	for _, p := range prods {
		inventoryValue += float64(p.StockQuantity) * p.UnitPrice
		if p.StockQuantity <= p.LowStockThreshold {
			low++
		}
		if p.ExpiryDate != nil && p.ExpiryDate.Sub(now) <= 90*24*time.Hour && p.ExpiryDate.After(now) {
			expSoon++
		}
	}

	open := 0
	spendByMonth := map[string]float64{}
	for _, o := range orders {
		if o.Status != models.StatusReceived && o.Status != models.StatusCancelled {
			open++
		}
		key := o.CreatedAt.UTC().Format("2006-01")
		spendByMonth[key] += o.TotalAmount
	}

	months := make([]string, 0, len(spendByMonth))
	for k := range spendByMonth {
		months = append(months, k)
	}
	sort.Strings(months)
	ms := make([]MonthlyPoint, 0)
	for _, m := range months {
		ms = append(ms, MonthlyPoint{Month: m, Value: spendByMonth[m]})
	}
	if len(ms) > 12 {
		ms = ms[len(ms)-12:]
	}

	mixMap := map[string]float64{}
	for _, p := range prods {
		name := catName[p.CategoryID]
		if name == "" {
			name = "Uncategorized"
		}
		mixMap[name] += float64(p.StockQuantity) * p.UnitPrice
	}
	mix := make([]CategorySlice, 0)
	for k, v := range mixMap {
		mix = append(mix, CategorySlice{Category: k, Value: v})
	}
	sort.Slice(mix, func(i, j int) bool { return mix[i].Value > mix[j].Value })

	var revenue float64
	for _, p := range prods {
		revenue += float64(p.StockQuantity) * p.UnitPrice * 1.12
	}

	return &DashboardSummary{
		InventoryValue:    inventoryValue,
		SKUCount:          len(prods),
		LowStockCount:     low,
		ExpiringSoonCount: expSoon,
		OpenOrders:        open,
		MonthlySpend:      ms,
		CategoryMix:       mix,
		RevenueEstimate:   revenue,
	}, nil
}
