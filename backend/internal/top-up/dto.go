package topup

import (
	"time"

	"github.com/shopspring/decimal"
)

type TopupCreditingRequest struct {
	Rfid   string          `json:"rfid" validate:"required,min=8,max=100"`
	Amount decimal.Decimal `json:"amount" validate:"required,min=1,max=3000"`
}

type TopupCreditingResponse struct {
	TransactionID string          `json:"transaction_id"`
	UserID        string          `json:"user_id"`
	Amount        decimal.Decimal `json:"amount"`
	Timestamp     time.Time       `json:"timestamp"`
}