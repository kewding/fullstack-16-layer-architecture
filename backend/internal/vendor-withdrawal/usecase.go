package vendorwithdrawal

import (
	"context"
	"fmt"
	"math"
)

// UseCase is the business-logic contract for vendor withdrawal requests.
type UseCase interface {
	// ── vendor ────────────────────────────────────────────────────────────────
	SubmitRequest(ctx context.Context, userID string, amount float64) (*PendingVendorWithdrawalResponse, error)
	GetPendingRequest(ctx context.Context, userID string) (*PendingVendorWithdrawalResponse, error)
	CancelRequest(ctx context.Context, requestID string, userID string) error
	ListHistory(ctx context.Context, userID string, params VendorWithdrawalHistoryParams) (*PaginatedVendorWithdrawalHistory, error)
	GetWalletBalance(ctx context.Context, userID string) (float64, error)

	// ── cashier ───────────────────────────────────────────────────────────────
	ListPendingRequests(ctx context.Context, params CashierVendorWithdrawalParams) (*PaginatedCashierVendorWithdrawals, error)
	CompleteRequest(ctx context.Context, requestID string, cashierID string) error
	RejectRequest(ctx context.Context, requestID string, cashierID string, input RejectVendorWithdrawalInput) error
	ListCompletedRequests(ctx context.Context, params CashierVendorWithdrawalParams) (*PaginatedCashierVendorCompleted, error)
	ListRejectedRequests(ctx context.Context, params CashierVendorWithdrawalParams) (*PaginatedCashierVendorRejected, error)
	GetPendingCount(ctx context.Context) (int, error)
}

type vendorWithdrawalUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &vendorWithdrawalUseCase{repo: repo}
}

// ── vendor ────────────────────────────────────────────────────────────────────

func (uc *vendorWithdrawalUseCase) GetWalletBalance(ctx context.Context, userID string) (float64, error) {
	_, balance, err := uc.repo.GetVendorByUserID(ctx, userID)
	return balance, err
}

func (uc *vendorWithdrawalUseCase) SubmitRequest(ctx context.Context, userID string, amount float64) (*PendingVendorWithdrawalResponse, error) {
	// 1. Resolve vendor_id and current wallet balance.
	vendorID, balance, err := uc.repo.GetVendorByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("SubmitRequest resolve vendor: %w", err)
	}

	// 2. Minimum amount guard.
	if amount < 1 {
		return nil, ErrMinimumAmount
	}

	// 3. Amount must not exceed wallet balance.
	if amount > balance {
		return nil, ErrAmountExceedsBalance
	}

	// 4. Only one pending request at a time.
	hasPending, err := uc.repo.HasPendingRequest(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("SubmitRequest check pending: %w", err)
	}
	if hasPending {
		return nil, ErrPendingRequestExists
	}

	// 5. Insert.
	if _, err = uc.repo.SubmitRequest(ctx, userID, vendorID, amount); err != nil {
		return nil, fmt.Errorf("SubmitRequest insert: %w", err)
	}

	// 6. Return the newly created row.
	pending, err := uc.repo.GetPendingRequest(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("SubmitRequest fetch new: %w", err)
	}
	return pending, nil
}

func (uc *vendorWithdrawalUseCase) GetPendingRequest(ctx context.Context, userID string) (*PendingVendorWithdrawalResponse, error) {
	return uc.repo.GetPendingRequest(ctx, userID)
}

func (uc *vendorWithdrawalUseCase) CancelRequest(ctx context.Context, requestID string, userID string) error {
	// Hard-delete the pending row — cancelled requests do not appear in history.
	return uc.repo.DeletePendingRequest(ctx, requestID, userID)
}

func (uc *vendorWithdrawalUseCase) ListHistory(ctx context.Context, userID string, params VendorWithdrawalHistoryParams) (*PaginatedVendorWithdrawalHistory, error) {
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
	return &PaginatedVendorWithdrawalHistory{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

// ── cashier ───────────────────────────────────────────────────────────────────

func (uc *vendorWithdrawalUseCase) ListPendingRequests(ctx context.Context, params CashierVendorWithdrawalParams) (*PaginatedCashierVendorWithdrawals, error) {
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
	return &PaginatedCashierVendorWithdrawals{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *vendorWithdrawalUseCase) CompleteRequest(ctx context.Context, requestID string, cashierID string) error {
	req, err := uc.repo.GetRequestByID(ctx, requestID)
	if err != nil {
		return err
	}
	if req.Status != "pending" {
		return ErrNotPending
	}

	cashierName, err := uc.repo.GetCashierName(ctx, cashierID)
	if err != nil {
		return fmt.Errorf("CompleteRequest get cashier name: %w", err)
	}

	if err := uc.repo.CompleteRequest(ctx, requestID, cashierID, cashierName); err != nil {
		return err
	}

	// Notify vendor (fire-and-forget).
	go func() {
		msg := fmt.Sprintf(
			"Your remittance request of ₱%.2f has been completed. Please collect your cash from the cashier.",
			req.Amount,
		)
		_ = uc.repo.CreateUserNotification(
			context.Background(),
			req.UserID,
			"vendor_withdrawal_accepted",
			msg,
			map[string]interface{}{
				"request_id": requestID,
				"amount":     req.Amount,
			},
		)
	}()

	return nil
}

func (uc *vendorWithdrawalUseCase) RejectRequest(ctx context.Context, requestID string, cashierID string, input RejectVendorWithdrawalInput) error {
	if input.Reason == ReasonOther && input.Comment == "" {
		return ErrInvalidRejectionInput
	}

	req, err := uc.repo.GetRequestByID(ctx, requestID)
	if err != nil {
		return err
	}
	if req.Status != "pending" {
		return ErrNotPending
	}

	cashierName, err := uc.repo.GetCashierName(ctx, cashierID)
	if err != nil {
		return fmt.Errorf("RejectRequest get cashier name: %w", err)
	}

	if err := uc.repo.RejectRequest(ctx, requestID, cashierID, cashierName, input.Reason, input.Comment); err != nil {
		return err
	}

	// Notify vendor (fire-and-forget).
	go func() {
		msg := fmt.Sprintf(
			"Your remittance request of ₱%.2f has been rejected. Reason: %s.",
			req.Amount, string(input.Reason),
		)
		_ = uc.repo.CreateUserNotification(
			context.Background(),
			req.UserID,
			"vendor_withdrawal_rejected",
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

func (uc *vendorWithdrawalUseCase) ListCompletedRequests(ctx context.Context, params CashierVendorWithdrawalParams) (*PaginatedCashierVendorCompleted, error) {
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
	return &PaginatedCashierVendorCompleted{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *vendorWithdrawalUseCase) ListRejectedRequests(ctx context.Context, params CashierVendorWithdrawalParams) (*PaginatedCashierVendorRejected, error) {
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
	return &PaginatedCashierVendorRejected{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *vendorWithdrawalUseCase) GetPendingCount(ctx context.Context) (int, error) {
	return uc.repo.GetPendingCount(ctx)
}