package concessionfees

import (
	"context"
	"fmt"
	"time"
)

// UseCase is the business-logic contract for concession fee management.
type UseCase interface {
	// GetFees returns the current and next-month state for all 4 fee components.
	GetFees(ctx context.Context) (*GetFeesResponse, error)

	// SetFee sets a fee component for next month.
	// Returns ErrFeeAlreadySetForNextMonth if already locked.
	// Returns ErrInvalidFeeType if feeType is not one of the 4 valid types.
	SetFee(ctx context.Context, feeType FeeType, amount float64, setByUserID string) (*SetFeeResponse, error)

	// CarryForwardAndSync is called by the background job on the 1st of each month.
	// It inserts carry-forward rows for any fee_type not yet set for this month,
	// then syncs vendors.concession_fee_value.
	CarryForwardAndSync(ctx context.Context) error
}

type feeUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &feeUseCase{repo: repo}
}

// currentMonthStr returns the first day of the current calendar month as YYYY-MM-DD.
func currentMonthStr() string {
	now := time.Now().UTC()
	return fmt.Sprintf("%d-%02d-01", now.Year(), now.Month())
}

// nextMonthStr returns the first day of next calendar month as YYYY-MM-DD.
func nextMonthStr() string {
	now := time.Now().UTC()
	next := now.AddDate(0, 1, 0)
	return fmt.Sprintf("%d-%02d-01", next.Year(), next.Month())
}

// monthAfterNextStr returns the 1st of the month after next (used for LockedUntil display).
func monthAfterNextStr() string {
	now := time.Now().UTC()
	after := now.AddDate(0, 2, 0)
	return fmt.Sprintf("%d-%02d-01", after.Year(), after.Month())
}

func (uc *feeUseCase) GetFees(ctx context.Context) (*GetFeesResponse, error) {
	currentMonth := currentMonthStr()
	nextMonth := nextMonthStr()
	lockedUntil := monthAfterNextStr()

	pairs, err := uc.repo.GetCurrentAndNextRows(ctx, currentMonth, nextMonth)
	if err != nil {
		return nil, fmt.Errorf("GetFees: %w", err)
	}

	resp := &GetFeesResponse{}
	var totalCurrent, totalNext float64

	buildState := func(ft FeeType) FeeComponentState {
		pair := pairs[ft]
		state := FeeComponentState{
			EffectiveMonth: currentMonth,
		}

		// Current month amount (0 if never set)
		if pair[0] != nil {
			state.CurrentMonthAmount = pair[0].Amount
			state.EffectiveMonth = pair[0].EffectiveMonth
		}

		// Next month
		if pair[1] != nil {
			state.NextMonthAmount = &pair[1].Amount
			state.Locked = true
			state.LockedUntil = &lockedUntil
		}

		totalCurrent += state.CurrentMonthAmount
		if state.NextMonthAmount != nil {
			totalNext += *state.NextMonthAmount
		} else {
			totalNext += state.CurrentMonthAmount
		}

		return state
	}

	resp.UtilityCharges = buildState(FeeTypeUtilityCharges)
	resp.MaintenanceRent = buildState(FeeTypeMaintenanceRent)
	resp.InsuranceAdministrative = buildState(FeeTypeInsuranceAdministrative)
	resp.PerformanceSecurity = buildState(FeeTypePerformanceSecurity)
	resp.TotalCurrentMonth = totalCurrent
	resp.TotalNextMonth = totalNext

	return resp, nil
}

func (uc *feeUseCase) SetFee(ctx context.Context, feeType FeeType, amount float64, setByUserID string) (*SetFeeResponse, error) {
	// Validate fee type
	valid := false
	for _, ft := range AllFeeTypes {
		if ft == feeType {
			valid = true
			break
		}
	}
	if !valid {
		return nil, ErrInvalidFeeType
	}

	nextMonth := nextMonthStr()

	if err := uc.repo.InsertFeeForNextMonth(ctx, feeType, amount, nextMonth, setByUserID); err != nil {
		return nil, err // passes through ErrFeeAlreadySetForNextMonth
	}

	// Sync vendors.concession_fee_value to the new next-month total
	// (so the balance table is immediately up to date for planning purposes).
	total, err := uc.repo.GetActiveFeeTotal(ctx, nextMonth)
	if err != nil {
		// Non-fatal: log and continue
		_ = err
	} else {
		_ = uc.repo.SyncVendorsConcessionFeeValue(ctx, total)
	}

	return &SetFeeResponse{
		FeeType:        feeType,
		Amount:         amount,
		EffectiveMonth: nextMonth,
	}, nil
}

func (uc *feeUseCase) CarryForwardAndSync(ctx context.Context) error {
	currentMonth := currentMonthStr()

	if err := uc.repo.CarryForwardFees(ctx, currentMonth); err != nil {
		return fmt.Errorf("CarryForwardAndSync carry: %w", err)
	}

	total, err := uc.repo.GetActiveFeeTotal(ctx, currentMonth)
	if err != nil {
		return fmt.Errorf("CarryForwardAndSync total: %w", err)
	}

	if err := uc.repo.SyncVendorsConcessionFeeValue(ctx, total); err != nil {
		return fmt.Errorf("CarryForwardAndSync sync: %w", err)
	}

	return nil
}