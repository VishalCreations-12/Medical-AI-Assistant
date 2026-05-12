package services

import (
	"context"
	"sort"
	"strings"
	"time"

	"github.com/medical-ai-assistant/backend/repositories"
)

type InsightsService struct {
	Products repositories.ProductRepository
	Stock    repositories.StockEventRepository
	Categories repositories.CategoryRepository
}

type ReorderRecommendation struct {
	ProductID      string  `json:"productId"`
	Name           string  `json:"name"`
	SKU            string  `json:"sku"`
	SuggestedQty   int     `json:"suggestedQty"`
	Reason         string  `json:"reason"`
	Urgency        string  `json:"urgency"`
	EstimatedCost  float64 `json:"estimatedCost"`
}

type LowStockPrediction struct {
	ProductID       string `json:"productId"`
	Name            string `json:"name"`
	DaysUntilStockout int  `json:"daysUntilStockout"`
	Confidence      string `json:"confidence"`
}

type TrendPoint struct {
	Month     string  `json:"month"`
	NetChange float64 `json:"netChange"`
}

type InsightsBundle struct {
	Recommendations      []ReorderRecommendation `json:"recommendations"`
	LowStockPredictions  []LowStockPrediction    `json:"lowStockPredictions"`
	Trends               []TrendPoint            `json:"trends"`
}

func (s *InsightsService) Generate(ctx context.Context) (*InsightsBundle, error) {
	prods, err := s.Products.List(ctx, repositories.ProductFilter{})
	if err != nil {
		return nil, err
	}
	cats, _ := s.Categories.List(ctx)
	catName := map[string]string{}
	for _, c := range cats {
		catName[c.ID] = c.Name
	}

	recs := make([]ReorderRecommendation, 0)
	preds := make([]LowStockPrediction, 0)
	for _, p := range prods {
		suggested := p.LowStockThreshold*2 - p.StockQuantity
		if suggested < p.LowStockThreshold {
			suggested = p.LowStockThreshold
		}
		if p.StockQuantity <= p.LowStockThreshold {
			urgency := "medium"
			reason := "Stock at or below reorder threshold"
			if p.StockQuantity <= p.LowStockThreshold/2 {
				urgency = "high"
				reason = "Critical stock level relative to policy"
			}
			recs = append(recs, ReorderRecommendation{
				ProductID:     p.ID,
				Name:          p.Name,
				SKU:           p.SKU,
				SuggestedQty:  suggested,
				Reason:        reason,
				Urgency:       urgency,
				EstimatedCost: float64(suggested) * p.UnitPrice,
			})
			daily := 1
			if p.StockQuantity > 30 {
				daily = 3
			}
			days := p.StockQuantity / daily
			if days < 0 {
				days = 0
			}
			conf := "medium"
			if len(catName[p.CategoryID]) > 0 && strings.Contains(strings.ToLower(catName[p.CategoryID]), "pharma") {
				conf = "high"
			}
			preds = append(preds, LowStockPrediction{
				ProductID:        p.ID,
				Name:             p.Name,
				DaysUntilStockout: days,
				Confidence:       conf,
			})
		}
	}

	rank := map[string]int{"high": 3, "medium": 2, "low": 1}
	sort.Slice(recs, func(i, j int) bool {
		ri := rank[recs[i].Urgency]
		rj := rank[recs[j].Urgency]
		if ri != rj {
			return ri > rj
		}
		return recs[i].EstimatedCost > recs[j].EstimatedCost
	})

	deltaByMonth := map[string]float64{}
	for _, p := range prods {
		events, err := s.Stock.ListByProduct(ctx, p.ID, 80)
		if err != nil {
			continue
		}
		for _, e := range events {
			t, err := time.Parse(time.RFC3339, e.At)
			if err != nil {
				continue
			}
			key := t.UTC().Format("2006-01")
			deltaByMonth[key] += float64(e.Delta)
		}
	}
	months := make([]string, 0, len(deltaByMonth))
	for k := range deltaByMonth {
		months = append(months, k)
	}
	sort.Strings(months)
	trends := make([]TrendPoint, 0)
	for _, m := range months {
		trends = append(trends, TrendPoint{Month: m, NetChange: deltaByMonth[m]})
	}
	if len(trends) > 18 {
		trends = trends[len(trends)-18:]
	}

	return &InsightsBundle{
		Recommendations:     recs,
		LowStockPredictions: preds,
		Trends:              trends,
	}, nil
}
