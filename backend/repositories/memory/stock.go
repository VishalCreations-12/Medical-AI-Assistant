package memory

import (
	"context"
	"time"

	"github.com/medical-ai-assistant/backend/repositories"
)

func (s *Store) AppendStockEvent(ctx context.Context, productID string, delta int, reason string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.stockEvents = append(s.stockEvents, repositories.StockEvent{
		At:        time.Now().UTC().Format(time.RFC3339),
		ProductID: productID,
		Delta:     delta,
		Reason:    reason,
	})
	if len(s.stockEvents) > 5000 {
		s.stockEvents = s.stockEvents[len(s.stockEvents)-5000:]
	}
	return nil
}

func (s *Store) ListStockEventsByProduct(ctx context.Context, productID string, limit int) ([]repositories.StockEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var matched []repositories.StockEvent
	for i := len(s.stockEvents) - 1; i >= 0; i-- {
		if s.stockEvents[i].ProductID == productID {
			matched = append(matched, s.stockEvents[i])
			if limit > 0 && len(matched) >= limit {
				break
			}
		}
	}
	for i, j := 0, len(matched)-1; i < j; i, j = i+1, j-1 {
		matched[i], matched[j] = matched[j], matched[i]
	}
	return matched, nil
}
