package cleanup

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"
)

type ExpiredInvitesCleaner struct {
	db *sql.DB
}

func NewExpiredInvitesCleaner(db *sql.DB) *ExpiredInvitesCleaner {
	return &ExpiredInvitesCleaner{db: db}
}

func (c *ExpiredInvitesCleaner) Run(ctx context.Context) {
	log.Println("Cleanup: starting expired invites cleaner")

	for {
		now := time.Now().UTC()
		nextMidnight := time.Date(
			now.Year(), now.Month(), now.Day()+1,
			0, 0, 0, 0, time.UTC,
		)
		durationUntilMidnight := time.Until(nextMidnight)

		log.Printf("Cleanup: next run in %s", durationUntilMidnight.Round(time.Minute))

		select {
		case <-time.After(durationUntilMidnight):
			if err := c.cleanup(ctx); err != nil {
				log.Printf("Cleanup: error: %v", err)
			}
		case <-ctx.Done():
			log.Println("Cleanup: stopping")
			return
		}
	}
}

func (c *ExpiredInvitesCleaner) cleanup(ctx context.Context) error {
	log.Println("Cleanup: running soft-delete cleanup...")

	// 1. Soft delete expired invitations
	// We also set the status to 'expired' to maintain the record's lifecycle state
	inviteQuery := `
    UPDATE vendor_invitations
    SET deleted_at = NOW(),
        status = 'expired'
    WHERE expires_at < NOW()
      AND deleted_at IS NULL
      AND email IN (
        SELECT email FROM vendors 
        WHERE status = 'invited' 
          AND deleted_at IS NULL
      )`

	inviteResult, err := c.db.ExecContext(ctx, inviteQuery)
	if err != nil {
		return fmt.Errorf("failed to soft-delete expired invitations: %w", err)
	}
	inviteCount, _ := inviteResult.RowsAffected()

	// 2. Soft delete stale vendor records
	// These are vendors who were invited but their invitations have now all been soft-deleted
	vendorQuery := `
    UPDATE vendors
    SET deleted_at = NOW()
    WHERE status = 'invited'
      AND deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM vendor_invitations
        WHERE vendor_invitations.email = vendors.email
          AND vendor_invitations.deleted_at IS NULL
      )`

	vendorResult, err := c.db.ExecContext(ctx, vendorQuery)
	if err != nil {
		return fmt.Errorf("failed to soft-delete stale vendor records: %w", err)
	}
	vendorCount, _ := vendorResult.RowsAffected()

	log.Printf("Cleanup: soft-deleted %d expired invitations and %d stale vendor records",
		inviteCount, vendorCount)

	return nil
}
