package vendordashboard

import (
	"context"
	"fmt"
	"time"
)

// UseCase is the business-logic contract for the vendor dashboard.
type UseCase interface {
	// GetDailyProfitCard returns all figures needed for the daily net profit card.
	GetDailyProfitCard(ctx context.Context, vendorID string) (*DailyProfitCard, error)

	// GetWalletCard returns the vendor's live wallet balance.
	GetWalletCard(ctx context.Context, vendorID string) (*WalletCard, error)

	// GetTopSelling returns the top 5 products by total quantity sold.
	GetTopSelling(ctx context.Context, vendorID string) (*TopSellingResponse, error)

	// GetTopRated returns the top 3 products by average rating.
	GetTopRated(ctx context.Context, vendorID string) (*TopRatedResponse, error)

	// GetAllergenCount returns the allergen intervention count for the last 7 days.
	GetAllergenCount(ctx context.Context, vendorID string) (*AllergenCountResponse, error)

	// GetAllergenTable returns the recent allergen interventions for the last 7 days.
	GetAllergenTable(ctx context.Context, vendorID string) (*AllergenTableResponse, error)

	// GetVendorIDByUserID resolves vendor ID from JWT user_id.
	GetVendorIDByUserID(ctx context.Context, userID string) (string, error)
}

type dashboardUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &dashboardUseCase{repo: repo}
}

func (uc *dashboardUseCase) GetVendorIDByUserID(ctx context.Context, userID string) (string, error) {
	return uc.repo.GetVendorIDByUserID(ctx, userID)
}

// countBusinessDaysInMonth counts Mon–Fri days in the current calendar month.
func countBusinessDaysInMonth() int {
	now := time.Now()
	year, month, _ := now.Date()
	loc := now.Location()

	// First day of this month
	first := time.Date(year, month, 1, 0, 0, 0, 0, loc)
	// First day of next month
	next := first.AddDate(0, 1, 0)

	count := 0
	for d := first; d.Before(next); d = d.AddDate(0, 0, 1) {
		wd := d.Weekday()
		if wd != time.Saturday && wd != time.Sunday {
			count++
		}
	}
	return count
}

func (uc *dashboardUseCase) GetDailyProfitCard(ctx context.Context, vendorID string) (*DailyProfitCard, error) {
	grossProfit, err := uc.repo.GetDailyGrossProfit(ctx, vendorID)
	if err != nil {
		return nil, fmt.Errorf("GetDailyProfitCard gross: %w", err)
	}

	monthlyFee, err := uc.repo.GetActiveFeeTotal(ctx)
	if err != nil {
		return nil, fmt.Errorf("GetDailyProfitCard fee: %w", err)
	}

	bizDays := countBusinessDaysInMonth()
	var proratedFee float64
	if bizDays > 0 {
		proratedFee = monthlyFee / float64(bizDays)
	}

	// Round to 2 decimal places
	proratedFee = roundTwo(proratedFee)
	netProfit := roundTwo(grossProfit - proratedFee)

	return &DailyProfitCard{
		DailyGrossProfit:    grossProfit,
		MonthlyFeeTotal:     monthlyFee,
		BusinessDaysInMonth: bizDays,
		ProratedDailyFee:    proratedFee,
		DailyNetProfit:      netProfit,
		Date:                time.Now().Format("2006-01-02"),
	}, nil
}

func (uc *dashboardUseCase) GetWalletCard(ctx context.Context, vendorID string) (*WalletCard, error) {
	balance, err := uc.repo.GetWalletBalance(ctx, vendorID)
	if err != nil {
		return nil, err
	}
	return &WalletCard{Balance: balance}, nil
}

func (uc *dashboardUseCase) GetTopSelling(ctx context.Context, vendorID string) (*TopSellingResponse, error) {
	items, err := uc.repo.GetTopSellingItems(ctx, vendorID, 5)
	if err != nil {
		return nil, err
	}
	return &TopSellingResponse{Items: items}, nil
}

func (uc *dashboardUseCase) GetTopRated(ctx context.Context, vendorID string) (*TopRatedResponse, error) {
	items, err := uc.repo.GetTopRatedItems(ctx, vendorID, 3)
	if err != nil {
		return nil, err
	}
	return &TopRatedResponse{Items: items}, nil
}

func (uc *dashboardUseCase) GetAllergenCount(ctx context.Context, vendorID string) (*AllergenCountResponse, error) {
	count, err := uc.repo.GetAllergenInterventionCount(ctx, vendorID)
	if err != nil {
		return nil, err
	}
	since := time.Now().AddDate(0, 0, -7).Format(time.RFC3339)
	return &AllergenCountResponse{Count: count, Since: since}, nil
}

func (uc *dashboardUseCase) GetAllergenTable(ctx context.Context, vendorID string) (*AllergenTableResponse, error) {
	data, err := uc.repo.GetAllergenInterventionTable(ctx, vendorID)
	if err != nil {
		return nil, err
	}
	return &AllergenTableResponse{Data: data}, nil
}

func roundTwo(f float64) float64 {
	// avoid importing math; use integer arithmetic
	shifted := f * 100
	if shifted < 0 {
		shifted -= 0.5
	} else {
		shifted += 0.5
	}
	return float64(int64(shifted)) / 100
}