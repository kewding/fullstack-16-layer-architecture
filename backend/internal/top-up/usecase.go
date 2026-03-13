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

func NewTopupUseCase(repo Repository, notifier Notifier) UseCase {
	return &topupUseCase{repo: repo, notifier: notifier}
}

func (uc *topupUseCase) CreditTopup(ctx context.Context, req TopupCreditingRequest) (*TopupCreditingResponse, error) {
	// Step 1: Validate RFID and extract userID
	exists, userID, err := uc.repo.RfidExists(ctx, req.Rfid)
	if err != nil {
		return nil, fmt.Errorf("rfid lookup failed: %w", err)
	}
	if !exists {
		return nil, ErrRfidUnregistered
	}

	// Step 2: Begin transaction
	tx, err := uc.repo.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Step 3: Insert top-up record
	transactionID, err := uc.repo.CreditTopupAmount(ctx, tx, userID, req.Amount)
	if err != nil {
		_ = tx.Rollback(ctx)
		return nil, fmt.Errorf("failed to credit top-up: %w", err)
	}

	// Step 4: Build response
	res := &TopupCreditingResponse{
		TransactionID: transactionID,
		UserID:        userID,
		Amount:        req.Amount,
		Timestamp:     time.Now().UTC(),
	}

	// Step 5: Notify BEFORE committing — failure here rolls back the insert
	if err := uc.notifier.NotifyTopupSuccess(ctx, res); err != nil {
		_ = tx.Rollback(ctx)
		return nil, fmt.Errorf("notification failed, transaction rolled back: %w", err)
	}

	// Step 6: Only commit if everything succeeded
	if err := tx.Commit(ctx); err != nil {
		_ = tx.Rollback(ctx)
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return res, nil
}
