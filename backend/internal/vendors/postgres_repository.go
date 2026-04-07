package vendors

import (
	"context"
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

	conditions := []string{}
	args := []any{}
	argIdx := 1

	if params.Status != StatusAll {
		conditions = append(conditions, fmt.Sprintf("v.status = $%d", argIdx))
		args = append(args, string(params.Status))
		argIdx++
	}

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(v.email ILIKE $%d OR s.stall_name ILIKE $%d)",
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
		FROM vendors v
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
			v.email,
			s.stall_name,
			v.status,
			CONCAT(ui.first_name, ' ', ui.last_name) AS invited_by_name,
			vi.created_at AS invited_at,
			v.updated_at AS registered_at
		FROM vendors v
		LEFT JOIN stalls s ON s.user_id = v.user_id
		LEFT JOIN vendor_invitations vi ON vi.email = v.email
		LEFT JOIN users u_admin ON u_admin.id = vi.invited_by
		LEFT JOIN users_info ui ON ui.user_id = u_admin.id
		%s
		ORDER BY v.created_at DESC
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