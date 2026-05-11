package concessionfees

import "context"

// Repository is the data-access contract for concession fee settings.
type Repository interface {
	// GetCurrentAndNextRows returns up to 2 rows per fee_type:
	// the active row for the current month and the row for next month (if it exists).
	// Returns a map keyed by FeeType.
	GetCurrentAndNextRows(ctx context.Context, currentMonth, nextMonth string) (map[FeeType][2]*FeeRow, error)

	// InsertFeeForNextMonth inserts a new row with effective_month = next month's 1st.
	// Returns ErrFeeAlreadySetForNextMonth if a row already exists for that fee_type + month.
	InsertFeeForNextMonth(ctx context.Context, feeType FeeType, amount float64, nextMonth string, setByUserID string) error

	// CarryForwardFees inserts rows for targetMonth copying the most recent prior row
	// for each fee_type that does NOT yet have a row for targetMonth.
	// Called by the background job on the 1st of each month.
	CarryForwardFees(ctx context.Context, targetMonth string) error

	// GetActiveFeeTotal returns the sum of the 4 active fee components for the given month.
	// Used to sync vendors.concession_fee_value.
	GetActiveFeeTotal(ctx context.Context, month string) (float64, error)

	// SyncVendorsConcessionFeeValue updates vendors.concession_fee_value for all
	// in_business vendors to the given total.
	SyncVendorsConcessionFeeValue(ctx context.Context, total float64) error

	// GetFeeHistory returns all fee rows ordered by effective_month DESC, fee_type ASC.
	GetFeeHistory(ctx context.Context) ([]FeeHistoryRow, error)
}