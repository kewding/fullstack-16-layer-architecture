package withdrawal

import (
	"context"
	"fmt"
	"math"
)

type UseCase interface {
	// ── user ──────────────────────────────────────────────────────────────────
	SubmitRequest(ctx context.Context, userID string, amount float64) (*PendingWithdrawalResponse, error)
	GetPendingRequest(ctx context.Context, userID string) (*PendingWithdrawalResponse, error)
	CancelRequest(ctx context.Context, requestID string, userID string) error
	ListHistory(ctx context.Context, userID string, params WithdrawalHistoryParams) (*PaginatedWithdrawalHistory, error)

	// ── cashier ───────────────────────────────────────────────────────────────
	ListPendingRequests(ctx context.Context, params CashierWithdrawalParams) (*PaginatedCashierWithdrawals, error)
	CompleteRequest(ctx context.Context, requestID string, cashierID string) error
	RejectRequest(ctx context.Context, requestID string, cashierID string, input RejectWithdrawalInput) error
	ListCompletedRequests(ctx context.Context, params CashierWithdrawalParams) (*PaginatedCashierWithdrawalCompleted, error)
	ListRejectedRequests(ctx context.Context, params CashierWithdrawalParams) (*PaginatedCashierWithdrawalRejected, error)
	GetPendingCount(ctx context.Context) (int, error)
}

type withdrawalUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &withdrawalUseCase{repo: repo}
}

// ── user ──────────────────────────────────────────────────────────────────────

func (uc *withdrawalUseCase) SubmitRequest(ctx context.Context, userID string, amount float64) (*PendingWithdrawalResponse, error) {
	// 1. Block if there is already a pending withdrawal
	hasPending, err := uc.repo.HasPendingRequest(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("SubmitRequest check pending: %w", err)
	}
	if hasPending {
		return nil, ErrPendingRequestExists
	}

	// 2. Ensure the amount does not exceed the current wallet balance
	balance, err := uc.repo.GetWalletBalance(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("SubmitRequest get balance: %w", err)
	}
	if amount > balance {
		return nil, ErrAmountExceedsBalance
	}

	// 3. Insert the request row
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

func (uc *withdrawalUseCase) GetPendingRequest(ctx context.Context, userID string) (*PendingWithdrawalResponse, error) {
	return uc.repo.GetPendingRequest(ctx, userID)
}

func (uc *withdrawalUseCase) CancelRequest(ctx context.Context, requestID string, userID string) error {
	// Hard-delete the pending row — cancelled requests do not appear in history
	return uc.repo.DeletePendingRequest(ctx, requestID, userID)
}

func (uc *withdrawalUseCase) ListHistory(ctx context.Context, userID string, params WithdrawalHistoryParams) (*PaginatedWithdrawalHistory, error) {
	if params.Limit <= 0 {
		params.Limit = 10
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	data, total, err := uc.repo.ListHistory(ctx, userID, params)
	if err != nil {
		return nil, err
	}
	return &PaginatedWithdrawalHistory{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

// ── cashier ───────────────────────────────────────────────────────────────────

func (uc *withdrawalUseCase) ListPendingRequests(ctx context.Context, params CashierWithdrawalParams) (*PaginatedCashierWithdrawals, error) {
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
	return &PaginatedCashierWithdrawals{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *withdrawalUseCase) CompleteRequest(ctx context.Context, requestID string, cashierID string) error {
	// 1. Look up request for notification
	req, err := uc.repo.GetRequestByID(ctx, requestID)
	if err != nil {
		return err
	}
	if req.Status != "pending" {
		return ErrNotPending
	}

	// 2. Resolve cashier display name (snapshot stored on the row)
	cashierName, err := uc.repo.GetCashierName(ctx, cashierID)
	if err != nil {
		return fmt.Errorf("CompleteRequest get cashier name: %w", err)
	}

	// 3. Execute atomic wallet deduction + ledger entry + status update
	if err := uc.repo.CompleteRequest(ctx, requestID, cashierID, cashierName); err != nil {
		return err
	}

	// 4. Notify customer (fire-and-forget)
	go func() {
		msg := fmt.Sprintf("Your withdrawal request of ₱%.2f has been completed. Please collect your cash from the cashier.", req.Amount)
		_ = uc.repo.CreateUserNotification(
			context.Background(),
			req.UserID,
			"withdrawal_accepted",
			msg,
			map[string]interface{}{
				"request_id": requestID,
				"amount":     req.Amount,
			},
		)
	}()

	return nil
}

func (uc *withdrawalUseCase) RejectRequest(ctx context.Context, requestID string, cashierID string, input RejectWithdrawalInput) error {
	// Validate: comment is required when reason is "other"
	if input.Reason == ReasonOther && input.Comment == "" {
		return ErrInvalidRejectionInput
	}

	// Look up request for notification
	req, err := uc.repo.GetRequestByID(ctx, requestID)
	if err != nil {
		return err
	}
	if req.Status != "pending" {
		return ErrNotPending
	}

	// Resolve cashier display name
	cashierName, err := uc.repo.GetCashierName(ctx, cashierID)
	if err != nil {
		return fmt.Errorf("RejectRequest get cashier name: %w", err)
	}

	if err := uc.repo.RejectRequest(ctx, requestID, cashierID, cashierName, input.Reason, input.Comment); err != nil {
		return err
	}

	// Notify customer (fire-and-forget)
	go func() {
		msg := fmt.Sprintf("Your withdrawal request of ₱%.2f has been rejected. Reason: %s.", req.Amount, string(input.Reason))
		_ = uc.repo.CreateUserNotification(
			context.Background(),
			req.UserID,
			"withdrawal_rejected",
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

func (uc *withdrawalUseCase) ListCompletedRequests(ctx context.Context, params CashierWithdrawalParams) (*PaginatedCashierWithdrawalCompleted, error) {
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
	return &PaginatedCashierWithdrawalCompleted{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *withdrawalUseCase) ListRejectedRequests(ctx context.Context, params CashierWithdrawalParams) (*PaginatedCashierWithdrawalRejected, error) {
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
	return &PaginatedCashierWithdrawalRejected{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *withdrawalUseCase) GetPendingCount(ctx context.Context) (int, error) {
	return uc.repo.GetPendingCount(ctx)
}