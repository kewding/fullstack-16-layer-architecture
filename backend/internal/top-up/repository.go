package topup

import (
	"context"

	"github.com/shopspring/decimal"
)

type Repository interface {
	RfidExists(ctx context.Context, rfid string) (bool, string, error)

	BeginTx(ctx context.Context) (Tx, error)

	CreditTopupAmount(ctx context.Context, tx Tx, userID string, amount decimal.Decimal) (string, error)
}

type Tx interface {
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}
