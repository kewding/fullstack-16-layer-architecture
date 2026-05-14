package vendorsledger

import (
	"context"
	"fmt"
	"math"
	"time"
)

// UseCase is the business-logic contract for the vendors ledger.
type UseCase interface {
	// GetLedger returns the paginated ledger for a vendor. Used by both admin and vendor.
	GetLedger(ctx context.Context, vendorID string, page, limit int) (*GetLedgerResponse, error)

	// PostMonthlyEntries posts ONLY the concession_fee DEBIT entries for all
	// in_business vendors for the given billing month.
	//
	// NOTE: gross_profit CREDIT entries are now inserted in real-time per sale
	// by the Express POS service at the moment of each wallet transaction.
	// This job no longer posts gross_profit.
	//
	// billingMonth must be the first day of the target month (e.g. "2025-04-01").
	// Idempotent: vendors already posted for that month are skipped.
	PostMonthlyEntries(ctx context.Context, billingMonth string) error

	// InsertRemittanceDebit posts a remittance DEBIT entry for a vendor.
	// Called by the remittance approval flow.
	InsertRemittanceDebit(ctx context.Context, vendorID string, amount float64, remittanceID string) error

	GetVendorIDByUserID(ctx context.Context, userID string) (string, error)
}

type ledgerUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &ledgerUseCase{repo: repo}
}

func (uc *ledgerUseCase) GetLedger(ctx context.Context, vendorID string, page, limit int) (*GetLedgerResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return uc.repo.GetLedger(ctx, vendorID, page, limit)
}

// PostMonthlyEntries posts ONLY the concession_fee DEBIT for all in_business
// vendors for the given billing month.
//
// gross_profit entries are now real-time (inserted by the Express POS service
// per wallet-payment sale), so this job no longer touches gross_profit.
func (uc *ledgerUseCase) PostMonthlyEntries(ctx context.Context, billingMonth string) error {
	// Validate and normalise billing month to 1st of month
	t, err := time.Parse("2006-01-02", billingMonth)
	if err != nil {
		return fmt.Errorf("PostMonthlyEntries: invalid billingMonth %q: %w", billingMonth, err)
	}
	// Snap to 1st of month regardless of input
	billingMonth = fmt.Sprintf("%d-%02d-01", t.Year(), t.Month())

	vendors, err := uc.repo.GetAllInBusinessVendors(ctx)
	if err != nil {
		return fmt.Errorf("PostMonthlyEntries get vendors: %w", err)
	}

	// Fetch the active fee total once — it's the same for all vendors.
	feeTotal, err := uc.repo.GetActiveFeeForMonth(ctx, billingMonth)
	if err != nil {
		return fmt.Errorf("PostMonthlyEntries get fee: %w", err)
	}

	// Nothing to post if there are no fees configured.
	if feeTotal <= 0 {
		return nil
	}

	refType := "concession_fee_settings"
	feeNote := fmt.Sprintf("Concession fee for billing month %s", billingMonth)

	for _, v := range vendors {
		insertErr := uc.repo.InsertEntry(ctx, InsertLedgerEntryParams{
			VendorID:      v.VendorID,
			EntryType:     EntryTypeConcessionFee,
			Amount:        feeTotal,
			Direction:     DirectionDebit,
			BillingMonth:  &billingMonth,
			ReferenceType: &refType,
			Note:          &feeNote,
		})
		if insertErr != nil && insertErr != ErrAlreadyPosted {
			return fmt.Errorf("PostMonthlyEntries insert fee vendor %s: %w", v.VendorID, insertErr)
		}
	}

	return nil
}

// InsertRemittanceDebit posts a remittance DEBIT and updates the wallet.
// Returns ErrInsufficientBalance if the vendor's net balance is insufficient.
func (uc *ledgerUseCase) InsertRemittanceDebit(ctx context.Context, vendorID string, amount float64, remittanceID string) error {
	refType := "remittances"
	note := fmt.Sprintf("Remittance payout approved, amount: %.2f", amount)

	return uc.repo.InsertEntry(ctx, InsertLedgerEntryParams{
		VendorID:      vendorID,
		EntryType:     EntryTypeRemittance,
		Amount:        roundToTwo(amount),
		Direction:     DirectionDebit,
		BillingMonth:  nil, // remittances are not tied to a single billing month
		ReferenceID:   &remittanceID,
		ReferenceType: &refType,
		Note:          &note,
	})
}

// ---- helpers ----

func strPtr(s string) *string { return &s }

func roundToTwo(f float64) float64 {
	return math.Round(f*100) / 100
}

func (uc *ledgerUseCase) GetVendorIDByUserID(ctx context.Context, userID string) (string, error) {
	return uc.repo.GetVendorIDByUserID(ctx, userID)
}