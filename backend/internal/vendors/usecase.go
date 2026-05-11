package vendors

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"math"
	"time"
)

type UseCase interface {
	ListVendorsReview(ctx context.Context, params ListVendorsParams) (*PaginatedResponse[VendorReviewRow], error)
	ListVendorsBalance(ctx context.Context, params ListVendorsParams) (*PaginatedResponse[VendorBalanceRow], error)

	GetVendorDetail(ctx context.Context, vendorID string) (*VendorDetailResponse, error)

	ApproveVendor(ctx context.Context, vendorID string) (string, error)

	// RevokeVendorWithReason revokes an invited/for_review vendor, persisting the reason.
	RevokeVendorWithReason(ctx context.Context, vendorID string, req RevokeVendorRequest) error

	// GraduateVendor moves an in_business vendor to the former_vendors archive.
	// adminUserID is the authenticated admin performing the action.
	// Returns ErrWalletNotZero if the wallet balance is not exactly 0.00.
	GraduateVendor(ctx context.Context, vendorID string, adminUserID string, req GraduateVendorRequest) (*GraduateVendorResult, error)

	// GetVendorWalletBalance exposes the vendor's current wallet balance for the frontend guard.
	GetVendorWalletBalance(ctx context.Context, vendorID string) (float64, error)

	// Former vendors
	ListFormerVendors(ctx context.Context, params ListFormerVendorsParams) (*PaginatedResponse[FormerVendorRow], error)
	GetFormerVendorDetail(ctx context.Context, formerVendorID string) (*FormerVendorDetail, error)
	GetFormerVendorLedgerCSV(ctx context.Context, formerVendorID string) ([]byte, string, error)

	// Notifications
	GetNotifications(ctx context.Context) ([]Notification, error)
	MarkNotificationsRead(ctx context.Context) error
	GetUnreadCount(ctx context.Context) (int, error)
	CreateNotification(ctx context.Context, notifType string, message string) error
}

type vendorUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &vendorUseCase{repo: repo}
}

func (uc *vendorUseCase) ListVendorsReview(ctx context.Context, params ListVendorsParams) (*PaginatedResponse[VendorReviewRow], error) {
	if params.Limit == 0 {
		params.Limit = 10
	}
	if params.Page == 0 {
		params.Page = 1
	}
	data, total, err := uc.repo.ListVendorsReview(ctx, params)
	if err != nil {
		return nil, err
	}
	return &PaginatedResponse[VendorReviewRow]{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *vendorUseCase) ListVendorsBalance(ctx context.Context, params ListVendorsParams) (*PaginatedResponse[VendorBalanceRow], error) {
	if params.Limit == 0 {
		params.Limit = 10
	}
	if params.Page == 0 {
		params.Page = 1
	}
	data, total, err := uc.repo.ListVendorsBalance(ctx, params)
	if err != nil {
		return nil, err
	}
	return &PaginatedResponse[VendorBalanceRow]{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *vendorUseCase) GetVendorDetail(ctx context.Context, vendorID string) (*VendorDetailResponse, error) {
	return uc.repo.GetVendorDetail(ctx, vendorID)
}

func (uc *vendorUseCase) ApproveVendor(ctx context.Context, vendorID string) (string, error) {
	return uc.repo.ApproveVendor(ctx, vendorID)
}

func (uc *vendorUseCase) RevokeVendorWithReason(ctx context.Context, vendorID string, req RevokeVendorRequest) error {
	return uc.repo.RevokeVendorWithReason(ctx, vendorID, req)
}

// GraduateVendor passes adminUserID through to the repository so it can be
// recorded as removed_by in the former_vendors snapshot.
func (uc *vendorUseCase) GraduateVendor(ctx context.Context, vendorID string, adminUserID string, req GraduateVendorRequest) (*GraduateVendorResult, error) {
	return uc.repo.GraduateVendor(ctx, vendorID, adminUserID, req)
}

func (uc *vendorUseCase) GetVendorWalletBalance(ctx context.Context, vendorID string) (float64, error) {
	return uc.repo.GetWalletBalance(ctx, vendorID)
}

func (uc *vendorUseCase) ListFormerVendors(ctx context.Context, params ListFormerVendorsParams) (*PaginatedResponse[FormerVendorRow], error) {
	if params.Limit == 0 {
		params.Limit = 10
	}
	if params.Page == 0 {
		params.Page = 1
	}
	data, total, err := uc.repo.ListFormerVendors(ctx, params)
	if err != nil {
		return nil, err
	}
	return &PaginatedResponse[FormerVendorRow]{
		Data:       data,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(params.Limit))),
	}, nil
}

func (uc *vendorUseCase) GetFormerVendorDetail(ctx context.Context, formerVendorID string) (*FormerVendorDetail, error) {
	return uc.repo.GetFormerVendorDetail(ctx, formerVendorID)
}

// GetFormerVendorLedgerCSV resolves the vendor_id from the former_vendors record,
// fetches all ledger rows, and encodes them as CSV bytes.
func (uc *vendorUseCase) GetFormerVendorLedgerCSV(ctx context.Context, formerVendorID string) ([]byte, string, error) {
	detail, err := uc.repo.GetFormerVendorDetail(ctx, formerVendorID)
	if err != nil {
		return nil, "", err
	}

	ledgerRows, err := uc.repo.GetFormerVendorLedgerRows(ctx, detail.VendorID)
	if err != nil {
		return nil, "", err
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)

	// Header
	_ = w.Write([]string{
		"id", "entry_type", "amount", "direction", "signed_amount",
		"billing_month", "reference_id", "reference_type", "note", "created_at",
	})

	for _, row := range ledgerRows {
		_ = w.Write([]string{
			row.ID,
			row.EntryType,
			fmt.Sprintf("%.2f", row.Amount),
			fmt.Sprintf("%d", row.Direction),
			fmt.Sprintf("%.2f", row.SignedAmount),
			row.BillingMonth,
			row.ReferenceID,
			row.ReferenceType,
			row.Note,
			row.CreatedAt,
		})
	}
	w.Flush()

	filename := fmt.Sprintf("ledger_%s_%s.csv", detail.StallName, time.Now().Format("20060102"))
	return buf.Bytes(), filename, nil
}

func (uc *vendorUseCase) GetNotifications(ctx context.Context) ([]Notification, error) {
	return uc.repo.GetNotifications(ctx)
}

func (uc *vendorUseCase) MarkNotificationsRead(ctx context.Context) error {
	return uc.repo.MarkNotificationsRead(ctx)
}

func (uc *vendorUseCase) GetUnreadCount(ctx context.Context) (int, error) {
	return uc.repo.GetUnreadCount(ctx)
}

func (uc *vendorUseCase) CreateNotification(ctx context.Context, notifType string, message string) error {
	return uc.repo.CreateNotification(ctx, notifType, message)
}