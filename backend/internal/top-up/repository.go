package topup

import (
	"context"

	"github.com/shopspring/decimal"
)

type Repository interface {
	RfidExists(ctx context.Context, rfid string) (string, error)

	BeginTx(ctx context.Context) (Tx, error)

	CreditTopupAmount(ctx context.Context, tx Tx, userID string, amount decimal.Decimal) (string, error)
	LedgerRecordsCredit(ctx context.Context, tx Tx, userID string, amount decimal.Decimal, transactionID string, transactionType string) (string, error)
	UpdateWalletBalance(ctx context.Context, tx Tx, userID string, amount decimal.Decimal) error 
}

type Tx interface {
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}
