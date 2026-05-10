package jobs

import (
	"context"
	"fmt"
	"log"
	"time"

	concessionfees "github.com/kewding/backend/internal/concession-fees"
	vendorsledger "github.com/kewding/backend/internal/vendors-ledger"
)

// NotificationWriter is satisfied by any type that can create an admin notification.
// The vendors package UseCase already implements this; pass it in.
type NotificationWriter interface {
	CreateNotification(ctx context.Context, notifType string, message string) error
}

// EmailSender is satisfied by vendorinvite.EmailSender or any mailer.
// We add a new method SendFeeReminderEmail for the 15-day notification.
type FeeReminderEmailSender interface {
	SendFeeReminderEmail(toEmail, adminName, nextMonth string) error
}

// AdminEmailProvider fetches admin users' emails for the reminder.
type AdminEmailProvider interface {
	GetAdminEmails(ctx context.Context) ([]AdminContact, error)
}

// AdminContact is a minimal admin identity for notification purposes.
type AdminContact struct {
	Email string
	Name  string
}

// FeeScheduler handles all time-based jobs related to concession fees and the vendor ledger.
type FeeScheduler struct {
	feeUC       concessionfees.UseCase
	ledgerUC    vendorsledger.UseCase
	notifier    NotificationWriter
	emailSender FeeReminderEmailSender
	adminEmails AdminEmailProvider
}

// NewFeeScheduler constructs a FeeScheduler.
func NewFeeScheduler(
	feeUC concessionfees.UseCase,
	ledgerUC vendorsledger.UseCase,
	notifier NotificationWriter,
	emailSender FeeReminderEmailSender,
	adminEmails AdminEmailProvider,
) *FeeScheduler {
	return &FeeScheduler{
		feeUC:       feeUC,
		ledgerUC:    ledgerUC,
		notifier:    notifier,
		emailSender: emailSender,
		adminEmails: adminEmails,
	}
}

// Run starts the scheduler loop. It wakes up every hour and checks whether
// any of the scheduled tasks need to run today.
// Call as: go scheduler.Run(ctx)
func (s *FeeScheduler) Run(ctx context.Context) {
	log.Println("[FeeScheduler] started")

	// Fire immediately on startup to catch up if the server was down.
	s.tick(ctx)

	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("[FeeScheduler] shutting down")
			return
		case <-ticker.C:
			s.tick(ctx)
		}
	}
}

// tick is called every hour and dispatches jobs based on the current date.
func (s *FeeScheduler) tick(ctx context.Context) {
	now := time.Now().UTC()
	day := now.Day()

	// --- 1st of the month: carry-forward fees + post prior month's ledger entries ---
	if day == 1 && now.Hour() == 0 {
		s.runCarryForward(ctx, now)
		s.runMonthlyLedgerPost(ctx, now)
	}

	// --- 15th of the month (or the 15-day-before-next-month boundary):
	// Notify admin to review fees for next month. ---
	//
	// "15 days before the next month" means the 16th of the current month
	// when the month has 31 days, or similar. For simplicity we use the
	// calendar 15th of each month as the standard reminder day.
	if day == 15 && now.Hour() == 9 { // 9:00 AM UTC
		s.runFeeReminder(ctx, now)
	}
}

// runCarryForward carries forward fees and syncs vendor concession_fee_value.
func (s *FeeScheduler) runCarryForward(ctx context.Context, now time.Time) {
	log.Println("[FeeScheduler] running carry-forward for", now.Format("2006-01"))
	if err := s.feeUC.CarryForwardAndSync(ctx); err != nil {
		log.Printf("[FeeScheduler] carry-forward error: %v", err)
		return
	}
	log.Println("[FeeScheduler] carry-forward complete")
}

// runMonthlyLedgerPost posts gross_profit and concession_fee entries for all
// in_business vendors for the PREVIOUS month.
func (s *FeeScheduler) runMonthlyLedgerPost(ctx context.Context, now time.Time) {
	prev := now.AddDate(0, -1, 0)
	billingMonth := fmt.Sprintf("%d-%02d-01", prev.Year(), prev.Month())
	log.Printf("[FeeScheduler] posting monthly ledger entries for %s", billingMonth)

	if err := s.ledgerUC.PostMonthlyEntries(ctx, billingMonth); err != nil {
		log.Printf("[FeeScheduler] monthly post error: %v", err)

		// Notify admin of the failure via the notification system.
		_ = s.notifier.CreateNotification(ctx,
			"system_alert",
			fmt.Sprintf("Monthly ledger posting FAILED for billing month %s: %v", billingMonth, err),
		)
		return
	}

	log.Printf("[FeeScheduler] monthly ledger post complete for %s", billingMonth)

	_ = s.notifier.CreateNotification(ctx,
		"system_info",
		fmt.Sprintf("Monthly ledger entries successfully posted for billing month %s.", billingMonth),
	)
}

// runFeeReminder notifies admins to review next month's concession fees.
func (s *FeeScheduler) runFeeReminder(ctx context.Context, now time.Time) {
	next := now.AddDate(0, 1, 0)
	nextMonthLabel := next.Format("January 2006")

	log.Printf("[FeeScheduler] sending fee reminder for %s", nextMonthLabel)

	message := fmt.Sprintf(
		"Reminder: Please review and update concession fees for %s. "+
			"Fees can be set until the last day of this month. "+
			"If no changes are made, the current fees will carry forward automatically.",
		nextMonthLabel,
	)

	// 1. Admin notification bell
	_ = s.notifier.CreateNotification(ctx, "fee_reminder", message)

	// 2. Email all admin users
	if s.adminEmails != nil && s.emailSender != nil {
		admins, err := s.adminEmails.GetAdminEmails(ctx)
		if err != nil {
			log.Printf("[FeeScheduler] failed to fetch admin emails: %v", err)
			return
		}
		for _, admin := range admins {
			go func(a AdminContact) {
				if err := s.emailSender.SendFeeReminderEmail(a.Email, a.Name, nextMonthLabel); err != nil {
					log.Printf("[FeeScheduler] reminder email to %s failed: %v", a.Email, err)
				}
			}(admin)
		}
	}
}
