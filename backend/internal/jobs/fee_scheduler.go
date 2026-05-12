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
type NotificationWriter interface {
	CreateNotification(ctx context.Context, notifType string, message string) error
}

// FeeReminderEmailSender extends the email sender with all fee-related email methods.
// NOTE: Update the SendFeeReminderEmail signature in vendor-invite/email.go to match —
// add the daysLeft int parameter.
type FeeReminderEmailSender interface {
	SendFeeReminderEmail(toEmail, adminName, nextMonth string, daysLeft int) error
}

// AdminEmailProvider fetches admin users' emails for reminders.
type AdminEmailProvider interface {
	GetAdminEmails(ctx context.Context) ([]AdminContact, error)
}

// AdminContact is a minimal admin identity for notification purposes.
type AdminContact struct {
	Email string
	Name  string
}

// reminderTrigger describes one scheduled reminder event.
type reminderTrigger struct {
	dayOfMonth int    // calendar day (1-based) on which this fires
	notifType  string // matches the notification_type Postgres enum value
	daysLeft   int    // used in message copy and email subject
	label      string // used in log output only
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

// Run starts the scheduler loop. Wakes every hour to check for due tasks.
// Call as: go scheduler.Run(ctx)
func (s *FeeScheduler) Run(ctx context.Context) {
	log.Println("[FeeScheduler] started")
	s.tick(ctx) // fire immediately on startup to catch up after a restart

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

// tick is called every hour. Jobs are gated on day-of-month AND hour to avoid
// double-firing within the same day across server restarts.
func (s *FeeScheduler) tick(ctx context.Context) {
	now := time.Now().UTC()

	// ── Day 1 at midnight ───────────────────────────────────────────────────────
	// 1. Carry forward fees for the new month
	// 2. Post prior month's ledger entries for all vendors
	// 3. Notify admins that the fee edit window is now open
	if now.Day() == 1 && now.Hour() == 0 {
		s.runCarryForward(ctx, now)
		s.runMonthlyLedgerPost(ctx, now)
		s.runReminderTrigger(ctx, now, reminderTrigger{
			notifType: "fee_edit_open",
			daysLeft:  0,
			label:     "fee edit window open",
		})
		return
	}

	// ── Reminder triggers at 9:00 AM UTC ───────────────────────────────────────
	// Days are computed relative to the last day of the current month so they
	// work correctly for 28, 29, 30, and 31-day months.
	if now.Hour() != 9 {
		return
	}

	last := lastDayOfMonth(now)
	day := now.Day()

	// Build the reminder schedule for this month's actual length.
	triggers := []reminderTrigger{
		{dayOfMonth: last - 14, notifType: "fee_reminder", daysLeft: 15, label: "15-day reminder"},
		{dayOfMonth: last - 6, notifType: "fee_reminder_7day", daysLeft: 7, label: "7-day reminder"},
		{dayOfMonth: last - 2, notifType: "fee_reminder_3day", daysLeft: 3, label: "3-day reminder"},
	}

	for _, t := range triggers {
		if day == t.dayOfMonth {
			s.runReminderTrigger(ctx, now, t)
		}
	}
}

// runCarryForward carries forward fees and syncs vendors.concession_fee_value.
func (s *FeeScheduler) runCarryForward(ctx context.Context, now time.Time) {
	log.Println("[FeeScheduler] running carry-forward for", now.Format("2006-01"))
	if err := s.feeUC.CarryForwardAndSync(ctx); err != nil {
		log.Printf("[FeeScheduler] carry-forward error: %v", err)
		_ = s.notifier.CreateNotification(ctx,
			"system_alert",
			fmt.Sprintf("Fee carry-forward FAILED for %s: %v", now.Format("January 2006"), err),
		)
		return
	}
	log.Println("[FeeScheduler] carry-forward complete")
}

// runMonthlyLedgerPost posts gross_profit CREDIT and concession_fee DEBIT entries
// for all in_business vendors for the PREVIOUS calendar month.
func (s *FeeScheduler) runMonthlyLedgerPost(ctx context.Context, now time.Time) {
	prev := now.AddDate(0, -1, 0)
	billingMonth := fmt.Sprintf("%d-%02d-01", prev.Year(), prev.Month())
	log.Printf("[FeeScheduler] posting monthly ledger entries for %s", billingMonth)

	if err := s.ledgerUC.PostMonthlyEntries(ctx, billingMonth); err != nil {
		log.Printf("[FeeScheduler] monthly post error: %v", err)
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

// runReminderTrigger sends a bell notification and emails all admin users.
func (s *FeeScheduler) runReminderTrigger(ctx context.Context, now time.Time, t reminderTrigger) {
	next := now.AddDate(0, 1, 0)
	nextMonthLabel := next.Format("January 2006")

	log.Printf("[FeeScheduler] %s for %s", t.label, nextMonthLabel)

	// 1. Bell notification
	_ = s.notifier.CreateNotification(ctx, t.notifType, buildReminderMessage(t.notifType, nextMonthLabel, t.daysLeft))

	// 2. Email all admins
	if s.adminEmails == nil || s.emailSender == nil {
		return
	}
	admins, err := s.adminEmails.GetAdminEmails(ctx)
	if err != nil {
		log.Printf("[FeeScheduler] failed to fetch admin emails: %v", err)
		return
	}
	for _, admin := range admins {
		go func(a AdminContact) {
			if err := s.emailSender.SendFeeReminderEmail(a.Email, a.Name, nextMonthLabel, t.daysLeft); err != nil {
				log.Printf("[FeeScheduler] reminder email to %s failed: %v", a.Email, err)
			}
		}(admin)
	}
}

// buildReminderMessage returns the notification bell copy for each trigger type.
func buildReminderMessage(notifType, nextMonthLabel string, daysLeft int) string {
	switch notifType {
	case "fee_edit_open":
		return fmt.Sprintf(
			"Concession fees for %s can now be updated. You have until the end of this month to make changes. Unset fees will carry forward automatically.",
			nextMonthLabel,
		)
	case "fee_reminder":
		return fmt.Sprintf(
			"Reminder: 15 days left to update concession fees for %s. If no changes are made, current fees will carry forward automatically.",
			nextMonthLabel,
		)
	case "fee_reminder_7day":
		return fmt.Sprintf(
			"Reminder: Only 7 days left to update concession fees for %s. Review and set your fees before the month ends.",
			nextMonthLabel,
		)
	case "fee_reminder_3day":
		return fmt.Sprintf(
			"Urgent: Only 3 days left to update concession fees for %s. Fees not updated will carry forward from the current month.",
			nextMonthLabel,
		)
	default:
		return fmt.Sprintf("Reminder: %d day(s) left to update concession fees for %s.", daysLeft, nextMonthLabel)
	}
}

// ── Date helpers ──────────────────────────────────────────────────────────────

// lastDayOfMonth returns the last calendar day number of the month containing t.
func lastDayOfMonth(t time.Time) int {
	return time.Date(t.Year(), t.Month()+1, 1, 0, 0, 0, 0, time.UTC).AddDate(0, 0, -1).Day()
}
