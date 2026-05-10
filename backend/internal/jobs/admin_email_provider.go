package jobs

import (
	"context"
	"database/sql"
	"fmt"
)

// postgresAdminEmailProvider implements AdminEmailProvider using the DB.
type postgresAdminEmailProvider struct {
	db *sql.DB
}

// NewAdminEmailProvider constructs an AdminEmailProvider.
func NewAdminEmailProvider(db *sql.DB) AdminEmailProvider {
	return &postgresAdminEmailProvider{db: db}
}

// GetAdminEmails returns the email and full name of all active admin users (role_id = 1).
func (p *postgresAdminEmailProvider) GetAdminEmails(ctx context.Context) ([]AdminContact, error) {
	rows, err := p.db.QueryContext(ctx, `
		SELECT u.email, CONCAT(ui.first_name, ' ', ui.last_name)
		FROM users u
		JOIN users_info ui ON ui.user_id = u.id
		WHERE u.role_id = 1
		  AND u.deleted_at IS NULL`,
	)
	if err != nil {
		return nil, fmt.Errorf("GetAdminEmails: %w", err)
	}
	defer rows.Close()

	var contacts []AdminContact
	for rows.Next() {
		var c AdminContact
		if err := rows.Scan(&c.Email, &c.Name); err != nil {
			return nil, fmt.Errorf("GetAdminEmails scan: %w", err)
		}
		contacts = append(contacts, c)
	}
	return contacts, rows.Err()
}