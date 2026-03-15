package topup

import (
	"context"
	"fmt"
	"time"
)

// UseCase defines the business logic contract
type UseCase interface {
	CreditTopup(ctx context.Context, req TopupCreditingRequest) (*TopupCreditingResponse, error)
}

// Notifier is a stub interface
type Notifier interface {
	NotifyTopupSuccess(ctx context.Context, res *TopupCreditingResponse) error
}

type topupUseCase struct {
	repo     Repository
	notifier Notifier
}

func NewUseCase(repo Repository, notifier Notifier) UseCase {
	return &topupUseCase{repo: repo, notifier: notifier}
}

func (uc *topupUseCase) CreditTopup(ctx context.Context, req TopupCreditingRequest) (*TopupCreditingResponse, error) {
	// Step 1: Validate RFID and extract userID
	userID, err := uc.repo.RfidExists(ctx, req.Rfid)
	if err != nil {
		return nil, err
	}

	// Step 2: Begin transaction
	tx, err := uc.repo.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Step 3: Insert top-up record and user ledger
	transactionID, err := uc.repo.CreditTopupAmount(ctx, tx, userID, req.Amount)
	if err != nil {
		_ = tx.Rollback(ctx)
		return nil, fmt.Errorf("failed to credit top-up: %w", err)
	}

	_, err = uc.repo.LedgerRecordsCredit(ctx, tx, userID, req.Amount, transactionID, "top-up")
	if err != nil {
		_ = tx.Rollback(ctx)
		return nil, fmt.Errorf("failed to insert ledger record: %w", err)
	}

	// Step 4: Commit
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Step 5: Build response
	res := &TopupCreditingResponse{
		TransactionID: transactionID,
		UserID:        userID,
		Amount:        req.Amount,
		Timestamp:     time.Now().UTC(),
	}

	// Step 6: Notify fire-and-forget
	go func() {
		if err := uc.notifier.NotifyTopupSuccess(context.Background(), res); err != nil {
			// log only — notification failure does not affect the committed result
			fmt.Printf("notification failed for transaction %s: %v\n", res.TransactionID, err)
		}
	}()

	return res, nil
}
