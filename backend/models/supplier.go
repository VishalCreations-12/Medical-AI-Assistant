package models

import "time"

type Supplier struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Country   string    `json:"country"`
	CreatedAt time.Time `json:"createdAt"`
}
