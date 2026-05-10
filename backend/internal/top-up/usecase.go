package topup

import (
	"context"
	"fmt"
	"math"
	"time"
)

const (
	customerRoleID    = 2
	customerWalletCap = 50000.0
)

type UseCase interface {
	CreditTopup(ctx context.Context, req TopupCreditingRequest) (*TopupCreditingResponse, error)

	// ── user ──────────────────────────────────────────────────────────────────
	SubmitRequest(ctx context.Context, userID string, amount float64) (*PendingRequestResponse, error)
	GetPendingRequest(ctx context.Context, userID string) (*PendingRequestResponse, error)
	CancelRequest(ctx context.Context, requestID string, userID string) error
	ListTopUpHistory(ctx context.Context, userID string, params TopUpHistoryParams) (*PaginatedTopUpHistory, error)

	// ── cashier ───────────────────────────────────────────────────────────────
	ListPendingRequests(ctx context.Context, params CashierListParams) (*PaginatedCashierRequests, error)
	GetUserDetailForCashier(ctx context.Context, userID string) (*UserDetailForCashier, error)
	AcceptRequest(ctx context.Context, requestID string, cashierID string) error
	RejectRequest(ctx context.Context, requestID string, cashierID string, input RejectRequestInput) error
	ListRejectedRequests(ctx context.Context, params CashierListParams) (*PaginatedCashierRejected, error)
	ListCompletedRequests(ctx context.Context, params CashierListParams) (*PaginatedCashierCompleted, error)

	// ── notifications ─────────────────────────────────────────────────────────
	GetUserNotifications(ctx context.Context, userID string) ([]UserNotification, error)
	GetUserUnreadCount(ctx context.Context, userID string) (int, error)
	MarkUserNotificationsRead(ctx context.Context, userID string) error

	// GetPendingCount returns the total number of pending requests (for cashier badge).
	GetPendingCount(ctx context.Context) (int, error)
}

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

	// Step 3: Insert top-up transaction record
	transactionID, err := uc.repo.CreditTopupAmount(ctx, tx, userID, req.Amount)
	if err != nil {
		_ = tx.Rollback(ctx)
		return nil, fmt.Errorf("failed to credit top-up: %w", err)
	}

	// Step 4: Insert ledger record
	_, err = uc.repo.LedgerRecordsCredit(ctx, tx, userID, req.Amount, transactionID, "top-up")
	if err != nil {
		_ = tx.Rollback(ctx)
		return nil, fmt.Errorf("failed to insert ledger record: %w", err)
	}

	// Step 5: Update wallet balance atomically
	if err := uc.repo.UpdateWalletBalance(ctx, tx, userID, req.Amount); err != nil {
		_ = tx.Rollback(ctx)
		return nil, err // ErrInsufficientBalance or wrapped db error
	}

	// Step 6: Commit — all three operations succeed or none do
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Step 7: Build response
	res := &TopupCreditingResponse{
		TransactionID: transactionID,
		UserID:        userID,
		Amount:        req.Amount,
		Timestamp:     time.Now().UTC(),
	}

	// Step 8: Notify fire-and-forget
	go func() {
		if uc.notifier == nil {
			return
		}
		if err := uc.notifier.NotifyTopupSuccess(context.Background(), res); err != nil {
			fmt.Printf("notification failed for transaction %s: %v\n", res.TransactionID, err)
		}
	}()

	return res, nil
}

// ── user ──────────────────────────────────────────────────────────────────────

func (uc *topupUseCase) SubmitRequest(ctx context.Context, userID string, amount float64) (*PendingRequestResponse, error) {
	// 1. Check for existing pending request
	hasPending, err := uc.repo.HasPendingRequest(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("SubmitRequest check pending: %w", err)
	}
	if hasPending {
		return nil, ErrPendingRequestExists
	}

	// 2. Enforce wallet cap for customer role only
	roleID, err := uc.repo.GetUserRoleID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("SubmitRequest get role: %w", err)
	}
	if roleID == customerRoleID {
		balance, err := uc.repo.GetWalletBalance(ctx, userID)
		if err != nil {
			return nil, fmt.Errorf("SubmitRequest get balance: %w", err)
		}
		if balance+amount > customerWalletCap {
			return nil, ErrWalletLimitExceeded
		}
	}

	// 3. Insert the request
	_, err = uc.repo.SubmitRequest(ctx, userID, amount)
	if err != nil {
		return nil, fmt.Errorf("SubmitRequest insert: %w", err)
	}

	// 4. Return the newly created pending request
	pending, err := uc.repo.GetPendingRequest(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("SubmitRequest fetch new: %w", err)
	}
	return pending, nil
}

func (uc *topupUseCase) GetPendingRequest(ctx context.Context, userID string) (*PendingRequestResponse, error) {
	return uc.repo.GetPendingRequest(ctx, userID)
}

func (uc *topupUseCase) CancelRequest(ctx context.Context, requestID string, userID string) error {
	return uc.repo.CancelRequest(ctx, requestID, userID)
}

func (uc *topupUseCase) ListTopUpHistory(ctx context.Context, userID string, params TopUpHistoryParams) (*PaginatedTopUpHistory, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	data, total, err := uc.repo.ListTopUpHistory(ctx, userID, params)
	if err != nil {
		return nil, err
	}
	return &PaginatedTopUpHistory{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

// ── cashier ───────────────────────────────────────────────────────────────────

func (uc *topupUseCase) ListPendingRequests(ctx context.Context, params CashierListParams) (*PaginatedCashierRequests, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	data, total, err := uc.repo.ListPendingRequests(ctx, params)
	if err != nil {
		return nil, err
	}
	return &PaginatedCashierRequests{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *topupUseCase) GetUserDetailForCashier(ctx context.Context, userID string) (*UserDetailForCashier, error) {
	return uc.repo.GetUserDetailForCashier(ctx, userID)
}

func (uc *topupUseCase) AcceptRequest(ctx context.Context, requestID string, cashierID string) error {
	// 1. Look up the request to get userID and amount for notification
	req, err := uc.repo.GetRequestByID(ctx, requestID)
	if err != nil {
		return err
	}
	if req.Status != StatusPending {
		return ErrNotPending
	}

	// 2. Run the atomic acceptance
	_, err = uc.repo.AcceptRequest(ctx, requestID, cashierID)
	if err != nil {
		return err
	}

	// 3. Fire user notification (non-blocking)
	go func() {
		msg := fmt.Sprintf("Your top-up request of ₱%.2f has been accepted.", req.Amount)
		_ = uc.repo.CreateUserNotification(
			context.Background(),
			req.UserID,
			"topup_accepted",
			msg,
			map[string]interface{}{
				"request_id": requestID,
				"amount":     req.Amount,
			},
		)
	}()

	return nil
}

func (uc *topupUseCase) RejectRequest(ctx context.Context, requestID string, cashierID string, input RejectRequestInput) error {
	// Validate: comment required when reason is "other"
	if input.Reason == ReasonOther && input.Comment == "" {
		return ErrInvalidRejectionInput
	}

	// Look up request for notification
	req, err := uc.repo.GetRequestByID(ctx, requestID)
	if err != nil {
		return err
	}
	if req.Status != StatusPending {
		return ErrNotPending
	}

	if err := uc.repo.RejectRequest(ctx, requestID, cashierID, input.Reason, input.Comment); err != nil {
		return err
	}

	// Fire user notification (non-blocking)
	go func() {
		msg := fmt.Sprintf("Your top-up request of ₱%.2f has been rejected.", req.Amount)
		_ = uc.repo.CreateUserNotification(
			context.Background(),
			req.UserID,
			"topup_rejected",
			msg,
			map[string]interface{}{
				"request_id":       requestID,
				"amount":           req.Amount,
				"rejection_reason": string(input.Reason),
				"comment":          input.Comment,
			},
		)
	}()

	return nil
}

func (uc *topupUseCase) ListRejectedRequests(ctx context.Context, params CashierListParams) (*PaginatedCashierRejected, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	data, total, err := uc.repo.ListRejectedRequests(ctx, params)
	if err != nil {
		return nil, err
	}
	return &PaginatedCashierRejected{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *topupUseCase) ListCompletedRequests(ctx context.Context, params CashierListParams) (*PaginatedCashierCompleted, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	data, total, err := uc.repo.ListCompletedRequests(ctx, params)
	if err != nil {
		return nil, err
	}
	return &PaginatedCashierCompleted{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

// ── notifications ─────────────────────────────────────────────────────────────

func (uc *topupUseCase) GetUserNotifications(ctx context.Context, userID string) ([]UserNotification, error) {
	return uc.repo.GetUserNotifications(ctx, userID)
}

func (uc *topupUseCase) GetUserUnreadCount(ctx context.Context, userID string) (int, error) {
	return uc.repo.GetUserUnreadCount(ctx, userID)
}

func (uc *topupUseCase) MarkUserNotificationsRead(ctx context.Context, userID string) error {
	return uc.repo.MarkUserNotificationsRead(ctx, userID)
}

func (uc *topupUseCase) GetPendingCount(ctx context.Context) (int, error) {
	// We reuse ListPendingRequests with page=1, limit=1 just to get the total
	_, total, err := uc.repo.ListPendingRequests(ctx, CashierListParams{Page: 1, Limit: 1})
	return total, err
}
