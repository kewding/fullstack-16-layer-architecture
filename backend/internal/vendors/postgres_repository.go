package vendors

import (
	"context"
	"errors"
	"database/sql"
	"fmt"
	"strings"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

func (r *postgresRepository) ListVendorsReview(ctx context.Context, params ListVendorsParams) ([]VendorReviewRow, int, error) {
	offset := (params.Page - 1) * params.Limit

	conditions := []string{"vi.deleted_at IS NULL", "v.deleted_at IS NULL"}
	args := []any{}
	argIdx := 1

	if params.Status != StatusAll {
		conditions = append(conditions, fmt.Sprintf("v.status = $%d", argIdx))
		args = append(args, string(params.Status))
		argIdx++
	}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(vi.email ILIKE $%d OR v.owner_name ILIKE $%d)",
			argIdx, argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	// count query
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM vendor_invitations vi
		LEFT JOIN vendors v ON v.email = vi.email
		LEFT JOIN stalls s ON s.user_id = v.user_id
		%s`, where)

	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count vendors: %w", err)
	}

	// data query
	args = append(args, params.Limit, offset)
	dataQuery := fmt.Sprintf(`
		SELECT
			v.id,
			vi.email,
			v.owner_name,
			s.stall_name,
			v.status,
			CONCAT(ui_admin.first_name, ' ', ui_admin.last_name) AS invited_by_name,
			vi.created_at AS invited_at,
			v.updated_at AS registered_at
		FROM vendor_invitations vi
		LEFT JOIN vendors v ON v.email = vi.email
		LEFT JOIN stalls s ON s.user_id = v.user_id
		LEFT JOIN users u_admin ON u_admin.id = vi.invited_by
		LEFT JOIN users_info ui_admin ON ui_admin.user_id = u_admin.id
		%s
		ORDER BY vi.created_at DESC
		LIMIT $%d OFFSET $%d`, where, argIdx, argIdx+1)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list vendors review: %w", err)
	}
	defer rows.Close()

	var vendors []VendorReviewRow
	for rows.Next() {
		var v VendorReviewRow
		var registeredAt sql.NullString
		var invitedByName sql.NullString

		err := rows.Scan(
			&v.ID,
			&v.Email,
			&v.OwnerName,
			&v.StallName,
			&v.Status,
			&invitedByName,
			&v.InvitedAt,
			&registeredAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan vendor review row: %w", err)
		}

		if registeredAt.Valid {
			v.RegisteredAt = &registeredAt.String
		}
		if invitedByName.Valid {
			v.InvitedByName = invitedByName.String
		}

		vendors = append(vendors, v)
	}

	if vendors == nil {
		vendors = []VendorReviewRow{}
	}

	return vendors, total, nil
}

func (r *postgresRepository) ListVendorsBalance(ctx context.Context, params ListVendorsParams) ([]VendorBalanceRow, int, error) {
	offset := (params.Page - 1) * params.Limit

	conditions := []string{"v.status = 'in_business'"}
	args := []any{}
	argIdx := 1

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(s.stall_name ILIKE $%d OR CONCAT(ui.first_name, ' ', ui.last_name) ILIKE $%d)",
			argIdx, argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	where := "WHERE " + strings.Join(conditions, " AND ")

	// count query
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM vendors v
		LEFT JOIN stalls s ON s.user_id = v.user_id
		LEFT JOIN users_info ui ON ui.user_id = v.user_id
		%s`, where)

	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count vendors balance: %w", err)
	}

	// data query
	args = append(args, params.Limit, offset)
	dataQuery := fmt.Sprintf(`
		SELECT
			v.id,
			s.stall_name,
			CONCAT(ui.first_name, ' ', ui.last_name) AS owner_name,
			COALESCE(SUM(t.amount), 0) AS vendor_profit,
			v.concession_fee_type,
			v.concession_fee_value
		FROM vendors v
		LEFT JOIN stalls s ON s.user_id = v.user_id
		LEFT JOIN users_info ui ON ui.user_id = v.user_id
		LEFT JOIN top_up_transactions t ON t.user_id = v.user_id
		%s
		GROUP BY v.id, s.stall_name, ui.first_name, ui.last_name,
		         v.concession_fee_type, v.concession_fee_value
		ORDER BY vendor_profit DESC
		LIMIT $%d OFFSET $%d`, where, argIdx, argIdx+1)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list vendors balance: %w", err)
	}
	defer rows.Close()

	var vendors []VendorBalanceRow
	for rows.Next() {
		var v VendorBalanceRow
		var feeType sql.NullString
		var feeValue sql.NullFloat64

		err := rows.Scan(
			&v.ID,
			&v.StallName,
			&v.OwnerName,
			&v.VendorProfit,
			&feeType,
			&feeValue,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan vendor balance row: %w", err)
		}

		if feeType.Valid {
			v.ConcessionFeeType = &feeType.String
		}
		if feeValue.Valid {
			v.ConcessionFeeValue = &feeValue.Float64
		}

		// calculate concession fee and net profit
		if feeType.Valid && feeValue.Valid {
			if feeType.String == "percentage" {
				v.ConcessionFee = v.VendorProfit * (feeValue.Float64 / 100)
			} else {
				v.ConcessionFee = feeValue.Float64
			}
		}
		v.NetProfit = v.VendorProfit - v.ConcessionFee

		vendors = append(vendors, v)
	}

	if vendors == nil {
		vendors = []VendorBalanceRow{}
	}

	return vendors, total, nil
}

func (r *postgresRepository) GetVendorDetail(ctx context.Context, vendorID string) (*VendorDetailResponse, error) {
	query := `
		SELECT
			v.id, v.email, v.status,
			COALESCE(ui.first_name, ''),
			COALESCE(ui.middle_name, ''),
			COALESCE(ui.last_name, ''),
			COALESCE(ui.birth_date::TEXT, ''),
			COALESCE(ui.contact_no, ''),
			COALESCE(s.stall_name, ''),
			COALESCE(vb.dti_sec_number, ''),
			COALESCE(vb.tin, ''),
			vb.proof_of_business_address_url,
			vb.barangay_clearance_url,
			vb.mayors_permit_url,
			COALESCE(vb.is_dti_verified, false),
			COALESCE(vb.is_tin_verified, false),
			COALESCE(vb.is_documents_verified, false)
		FROM vendors v
		LEFT JOIN users_info ui ON ui.user_id = v.user_id
		LEFT JOIN stalls s ON s.user_id = v.user_id
		LEFT JOIN vendor_business_info vb ON vb.user_id = v.user_id
		WHERE v.id = $1
		  AND v.deleted_at IS NULL
		LIMIT 1`

	var res VendorDetailResponse
	err := r.db.QueryRowContext(ctx, query, vendorID).Scan(
		&res.ID, &res.Email, &res.Status,
		&res.FirstName, &res.MiddleName, &res.LastName,
		&res.BirthDate, &res.ContactNumber, &res.StallName,
		&res.DtiSecNumber, &res.Tin,
		&res.ProofOfBusinessAddressURL,
		&res.BarangayClearanceURL,
		&res.MayorsPermitURL,
		&res.IsDtiVerified, &res.IsTinVerified, &res.IsDocumentsVerified,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrVendorNotFound
		}
		return nil, fmt.Errorf("failed to get vendor detail: %w", err)
	}

	return &res, nil
}

func (r *postgresRepository) ApproveVendor(ctx context.Context, vendorID string) (string, error) {
	// check current status
	var status, email string
	err := r.db.QueryRowContext(ctx,
		`SELECT status, email FROM vendors WHERE id = $1 AND deleted_at IS NULL`,
		vendorID,
	).Scan(&status, &email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrVendorNotFound
		}
		return "", fmt.Errorf("failed to check vendor status: %w", err)
	}

	if status != "for_review" {
		return "", ErrNotForReview
	}

	_, err = r.db.ExecContext(ctx,
		`UPDATE vendors SET status = 'in_business', updated_at = NOW() WHERE id = $1`,
		vendorID,
	)
	if err != nil {
		return "", fmt.Errorf("failed to approve vendor: %w", err)
	}

	return email, nil
}

func (r *postgresRepository) CreateNotification(ctx context.Context, notifType string, message string) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO admin_notifications (type, message) VALUES ($1::notification_type, $2)`,
		notifType, message,
	)
	if err != nil {
		return fmt.Errorf("failed to create notification: %w", err)
	}
	return nil
}

func (r *postgresRepository) GetNotifications(ctx context.Context) ([]Notification, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, type, message, is_read, created_at
		 FROM admin_notifications
		 ORDER BY created_at DESC
		 LIMIT 50`,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get notifications: %w", err)
	}
	defer rows.Close()

	var notifications []Notification
	for rows.Next() {
		var n Notification
		if err := rows.Scan(&n.ID, &n.Type, &n.Message, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan notification: %w", err)
		}
		notifications = append(notifications, n)
	}

	if notifications == nil {
		notifications = []Notification{}
	}

	return notifications, nil
}

func (r *postgresRepository) MarkNotificationsRead(ctx context.Context) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE admin_notifications SET is_read = true WHERE is_read = false`,
	)
	return err
}

func (r *postgresRepository) GetUnreadCount(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM admin_notifications WHERE is_read = false`,
	).Scan(&count)
	return count, err
}

func (r *postgresRepository) RemoveFromBusiness(ctx context.Context, vendorID string) (*RemoveFromBusinessData, error) {
	// check current status and fetch financial data in one query
	query := `
		SELECT
			v.status,
			v.email,
			v.owner_name,
			COALESCE(s.stall_name, ''),
			COALESCE(w.balance, 0),
			COALESCE(SUM(t.amount), 0) AS total_sales
		FROM vendors v
		LEFT JOIN stalls s ON s.user_id = v.user_id
		LEFT JOIN wallets w ON w.user_id = v.user_id
		LEFT JOIN top_up_transactions t ON t.user_id = v.user_id
		WHERE v.id = $1
		  AND v.deleted_at IS NULL
		GROUP BY v.status, v.email, v.owner_name, s.stall_name, w.balance`

	var status string
	var data RemoveFromBusinessData

	err := r.db.QueryRowContext(ctx, query, vendorID).Scan(
		&status,
		&data.Email,
		&data.OwnerName,
		&data.StallName,
		&data.Balance,
		&data.TotalSales,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrVendorNotFound
		}
		return nil, fmt.Errorf("failed to get vendor data: %w", err)
	}

	if status != "in_business" {
		return nil, ErrNotInBusiness
	}

	// revert to for_review
	_, err = r.db.ExecContext(ctx,
		`UPDATE vendors SET status = 'for_review', updated_at = NOW() WHERE id = $1`,
		vendorID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to revert vendor status: %w", err)
	}

	return &data, nil
}