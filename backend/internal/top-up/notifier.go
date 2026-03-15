package topup

import (
	"context"
	"fmt"
)

type printNotifier struct{}

func NewPrintNotifier() Notifier {
	return &printNotifier{}
}

func (n *printNotifier) NotifyTopupSuccess(ctx context.Context, res *TopupCreditingResponse) error {
	fmt.Printf("top-up success — transaction_id: %s, user_id: %s, amount: %s, timestamp: %s\n",
		res.TransactionID,
		res.UserID,
		res.Amount.String(),
		res.Timestamp.String(),
	)
	return nil
}