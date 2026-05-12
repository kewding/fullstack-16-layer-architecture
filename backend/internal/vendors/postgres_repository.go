package vendors

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

// ── ListVendorsReview ─────────────────────────────────────────────────────────

func (r *postgresRepository) ListVendorsReview(ctx context.Context, params ListVendorsParams) ([]VendorReviewRow, int, error) {
	offset := (params.Page - 1) * params.Limit

	// u.deleted_at IS NULL OR u.id IS NULL — the second condition allows invited
	// vendors through since they have no users row yet (v.user_id IS NULL → LEFT JOIN
	// produces a null row, and NULL IS NULL evaluates to TRUE).
	conditions := []string{"vi.deleted_at IS NULL", "v.deleted_at IS NULL", "(u.deleted_at IS NULL OR u.id IS NULL)"}
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

	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM vendor_invitations vi
		LEFT JOIN vendors v ON v.email = vi.email
		LEFT JOIN users u ON u.id = v.user_id
		LEFT JOIN stalls s ON s.user_id = v.user_id
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count vendors: %w", err)
	}

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
		LEFT JOIN users u ON u.id = v.user_id
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
		var vendorID sql.NullString
		var ownerName sql.NullString
		var status sql.NullString
		var registeredAt sql.NullString
		var invitedByName sql.NullString

		if err := rows.Scan(
			&vendorID, &v.Email, &ownerName, &v.StallName, &status,
			&invitedByName, &v.InvitedAt, &registeredAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan vendor review row: %w", err)
		}

		if vendorID.Valid {
			v.ID = vendorID.String
		}
		if ownerName.Valid {
			v.OwnerName = ownerName.String
		}
		if status.Valid {
			v.Status = status.String
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

// ── ListVendorsBalance ────────────────────────────────────────────────────────

func (r *postgresRepository) ListVendorsBalance(ctx context.Context, params ListVendorsParams) ([]VendorBalanceRow, int, error) {
	offset := (params.Page - 1) * params.Limit

	// Base WHERE clause: Must be 'in_business' AND vendor record not deleted
	// AND the user record itself must NOT be soft-deleted (Option A)
	whereClauses := []string{"v.status = 'in_business'", "v.deleted_at IS NULL", "u.deleted_at IS NULL"}
	args := []interface{}{}
	argIdx := 1

	if params.Search != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("(s.stall_name ILIKE $%d OR ui.first_name ILIKE $%d OR ui.last_name ILIKE $%d)", argIdx, argIdx+1, argIdx+2))
		term := "%" + params.Search + "%"
		args = append(args, term, term, term)
		argIdx += 3
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	// Query to get the total count for pagination
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM vendors v
		JOIN users u ON u.id = v.user_id
		LEFT JOIN stalls s ON s.user_id = v.user_id
		LEFT JOIN users_info ui ON ui.user_id = v.user_id
		WHERE %s`, whereSQL)

	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count vendors balance: %w", err)
	}

	// Main query to fetch the data
	// Note: We join 'wallets' to get the live authoritative balance per business logic [2, 7]
	query := fmt.Sprintf(`
		SELECT 
			v.id, 
			s.stall_name, 
			CONCAT(ui.first_name, ' ', ui.last_name) as owner_name,
			COALESCE(w.balance, 0) as wallet_balance
		FROM vendors v
		JOIN users u ON u.id = v.user_id
		LEFT JOIN stalls s ON s.user_id = v.user_id
		LEFT JOIN users_info ui ON ui.user_id = v.user_id
		LEFT JOIN wallets w ON w.user_id = v.user_id
		WHERE %s
		ORDER BY s.stall_name ASC
		LIMIT $%d OFFSET $%d`, whereSQL, argIdx, argIdx+1)

	args = append(args, params.Limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list vendors balance: %w", err)
	}
	defer rows.Close()

	var result []VendorBalanceRow
	for rows.Next() {
		var row VendorBalanceRow
		if err := rows.Scan(&row.ID, &row.StallName, &row.OwnerName, &row.WalletBalance); err != nil {
			return nil, 0, err
		}
		result = append(result, row)
	}

	if result == nil {
		result = []VendorBalanceRow{}
	}
	return result, total, nil

	// return result, total, nil
}

// ── GetVendorDetail ───────────────────────────────────────────────────────────

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
		&res.ProofOfBusinessAddressURL, &res.BarangayClearanceURL, &res.MayorsPermitURL,
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

// ── ApproveVendor ─────────────────────────────────────────────────────────────

func (r *postgresRepository) ApproveVendor(ctx context.Context, vendorID string) (string, error) {
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

// ── RevokeVendorWithReason ────────────────────────────────────────────────────

func (r *postgresRepository) RevokeVendorWithReason(ctx context.Context, vendorID string, req RevokeVendorRequest) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("RevokeVendorWithReason begin tx: %w", err)
	}
	defer tx.Rollback()

	// 1. Fetch vendor email and check it exists
	var email, status string
	err = tx.QueryRowContext(ctx,
		`SELECT email, status FROM vendors WHERE id = $1 AND deleted_at IS NULL`,
		vendorID,
	).Scan(&email, &status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrVendorNotFound
		}
		return fmt.Errorf("RevokeVendorWithReason fetch vendor: %w", err)
	}

	if status != "invited" && status != "for_review" {
		return ErrNotForReview
	}

	// 2. Persist revoke reason on the vendor_invitations row
	reasonsJSON, err := json.Marshal(req.Reasons)
	if err != nil {
		return fmt.Errorf("RevokeVendorWithReason marshal reasons: %w", err)
	}

	var otherReason *string
	if req.OtherReason != "" {
		otherReason = &req.OtherReason
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE vendor_invitations
		SET revoked_reason = $1::jsonb, revoked_other_reason = $2
		WHERE email = $3 AND deleted_at IS NULL`,
		string(reasonsJSON), otherReason, email,
	)
	if err != nil {
		return fmt.Errorf("RevokeVendorWithReason update invitation: %w", err)
	}

	// 3. Soft-delete the vendor row
	_, err = tx.ExecContext(ctx,
		`UPDATE vendors SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
		vendorID,
	)
	if err != nil {
		return fmt.Errorf("RevokeVendorWithReason soft-delete vendor: %w", err)
	}

	return tx.Commit()
}

// ── GetWalletBalance ──────────────────────────────────────────────────────────

func (r *postgresRepository) GetWalletBalance(ctx context.Context, vendorID string) (float64, error) {
	var balance float64
	err := r.db.QueryRowContext(ctx, `
		SELECT COALESCE(w.balance, 0)
		FROM vendors v
		LEFT JOIN wallets w ON w.user_id = v.user_id
		WHERE v.id = $1 AND v.deleted_at IS NULL`,
		vendorID,
	).Scan(&balance)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrVendorNotFound
		}
		return 0, fmt.Errorf("GetWalletBalance: %w", err)
	}
	return balance, nil
}

// ── GraduateVendor ────────────────────────────────────────────────────────────

func (r *postgresRepository) GraduateVendor(
	ctx context.Context,
	vendorID string,
	adminUserID string,
	req GraduateVendorRequest,
) (*GraduateVendorResult, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("GraduateVendor begin tx: %w", err)
	}
	defer tx.Rollback()

	// 1. Check vendor exists and is in_business
	var status, email, ownerName string
	var userID sql.NullString
	err = tx.QueryRowContext(ctx,
		`SELECT status, email, owner_name, user_id FROM vendors WHERE id = $1 AND deleted_at IS NULL`,
		vendorID,
	).Scan(&status, &email, &ownerName, &userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrVendorNotFound
		}
		return nil, fmt.Errorf("GraduateVendor fetch vendor: %w", err)
	}
	if status != "in_business" {
		return nil, ErrNotInBusiness
	}

	// 2. Check wallet balance is exactly 0.00
	var walletBalance float64
	err = tx.QueryRowContext(ctx,
		`SELECT COALESCE(balance, 0) FROM wallets WHERE user_id = $1`,
		userID,
	).Scan(&walletBalance)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("GraduateVendor check wallet: %w", err)
	}
	if walletBalance != 0 {
		return nil, ErrWalletNotZero
	}

	// 3. Collect personal info snapshot
	type personalSnapshot struct {
		FirstName     string `json:"first_name"`
		MiddleName    string `json:"middle_name"`
		LastName      string `json:"last_name"`
		BirthDate     string `json:"birth_date"`
		ContactNumber string `json:"contact_number"`
		StallName     string `json:"stall_name"`
	}
	var ps personalSnapshot
	err = tx.QueryRowContext(ctx, `
		SELECT
			COALESCE(ui.first_name, ''),
			COALESCE(ui.middle_name, ''),
			COALESCE(ui.last_name, ''),
			COALESCE(ui.birth_date::TEXT, ''),
			COALESCE(ui.contact_no, ''),
			COALESCE(s.stall_name, '')
		FROM vendors v
		LEFT JOIN users_info ui ON ui.user_id = v.user_id
		LEFT JOIN stalls s ON s.user_id = v.user_id
		WHERE v.id = $1`, vendorID,
	).Scan(&ps.FirstName, &ps.MiddleName, &ps.LastName,
		&ps.BirthDate, &ps.ContactNumber, &ps.StallName)
	if err != nil {
		return nil, fmt.Errorf("GraduateVendor collect personal snapshot: %w", err)
	}

	personalJSON, _ := json.Marshal(ps)

	// 4. Collect business info snapshot
	type businessSnapshot struct {
		DtiSecNumber              string  `json:"dti_sec_number"`
		Tin                       string  `json:"tin"`
		ProofOfBusinessAddressURL *string `json:"proof_of_business_address_url"`
		BarangayClearanceURL      *string `json:"barangay_clearance_url"`
		MayorsPermitURL           *string `json:"mayors_permit_url"`
		IsDtiVerified             bool    `json:"is_dti_verified"`
		IsTinVerified             bool    `json:"is_tin_verified"`
		IsDocumentsVerified       bool    `json:"is_documents_verified"`
	}
	var bs businessSnapshot
	err = tx.QueryRowContext(ctx, `
		SELECT
			COALESCE(dti_sec_number, ''),
			COALESCE(tin, ''),
			proof_of_business_address_url,
			barangay_clearance_url,
			mayors_permit_url,
			COALESCE(is_dti_verified, false),
			COALESCE(is_tin_verified, false),
			COALESCE(is_documents_verified, false)
		FROM vendor_business_info
		WHERE user_id = $1`, userID,
	).Scan(&bs.DtiSecNumber, &bs.Tin,
		&bs.ProofOfBusinessAddressURL, &bs.BarangayClearanceURL, &bs.MayorsPermitURL,
		&bs.IsDtiVerified, &bs.IsTinVerified, &bs.IsDocumentsVerified)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("GraduateVendor collect business snapshot: %w", err)
	}
	businessJSON, _ := json.Marshal(bs)

	// 5. Collect ledger summary
	type ledgerSummary struct {
		TotalGrossProfit    float64 `json:"total_gross_profit"`
		TotalConcessionFees float64 `json:"total_concession_fees"`
		TotalRemittances    float64 `json:"total_remittances"`
		FinalNetBalance     float64 `json:"final_net_balance"`
		TotalSalesCount     int     `json:"total_sales_count"`
	}
	var ls ledgerSummary
	err = tx.QueryRowContext(ctx, `
		SELECT
			COALESCE(SUM(CASE WHEN entry_type = 'gross_profit'   THEN amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN entry_type = 'concession_fee' THEN amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN entry_type = 'remittance'     THEN amount ELSE 0 END), 0),
			COALESCE(SUM(amount * direction), 0),
			COUNT(CASE WHEN entry_type = 'gross_profit' THEN 1 END)
		FROM vendors_ledger
		WHERE vendor_id = $1`, vendorID,
	).Scan(&ls.TotalGrossProfit, &ls.TotalConcessionFees,
		&ls.TotalRemittances, &ls.FinalNetBalance, &ls.TotalSalesCount)
	if err != nil {
		return nil, fmt.Errorf("GraduateVendor collect ledger summary: %w", err)
	}
	ledgerJSON, _ := json.Marshal(ls)

	// 6. Build reasons JSONB
	type reasonsPayload struct {
		Selected    []string `json:"selected"`
		OtherReason string   `json:"other_reason,omitempty"`
	}
	rp := reasonsPayload{Selected: req.Reasons, OtherReason: req.OtherReason}
	reasonsJSON, _ := json.Marshal(rp)

	// 7. Insert former_vendors snapshot
	_, err = tx.ExecContext(ctx, `
		INSERT INTO former_vendors
			(vendor_id, removed_by, reasons, personal_info_snapshot, business_info_snapshot,
			 ledger_summary, stall_name, owner_name, email, removed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
		vendorID, adminUserID, reasonsJSON, personalJSON, businessJSON,
		ledgerJSON, ps.StallName, ownerName, email,
	)
	if err != nil {
		return nil, fmt.Errorf("GraduateVendor insert former_vendors: %w", err)
	}

	// 8. Detach user_id from vendors BEFORE hard-deleting the user.
	//    vendors.user_id has ON DELETE CASCADE from users, so deleting the user
	//    would cascade-delete the vendors row too — which would then violate the
	//    former_vendors_vendor_id_fkey FK we're about to insert.
	//    Nulling it first breaks the cascade while keeping the vendors row intact
	//    for the former_vendors FK reference.
	if userID.Valid {
		_, err = tx.ExecContext(ctx,
			`UPDATE vendors SET user_id = NULL, updated_at = NOW() WHERE id = $1`,
			vendorID,
		)
		if err != nil {
			return nil, fmt.Errorf("GraduateVendor detach user_id: %w", err)
		}

		_, err = tx.ExecContext(ctx,
			`DELETE FROM users WHERE id = $1`,
			userID.String,
		)
		if err != nil {
			return nil, fmt.Errorf("GraduateVendor hard-delete user: %w", err)
		}
	}

	// 9. Soft-delete the vendors row — kept for former_vendors FK integrity.
	_, err = tx.ExecContext(ctx,
		`UPDATE vendors SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
		vendorID,
	)
	if err != nil {
		return nil, fmt.Errorf("GraduateVendor soft-delete vendor: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("GraduateVendor commit: %w", err)
	}

	return &GraduateVendorResult{
		Email:       email,
		OwnerName:   ownerName,
		StallName:   ps.StallName,
		Reasons:     req.Reasons,
		OtherReason: req.OtherReason,
	}, nil
}

// ── ListFormerVendors ─────────────────────────────────────────────────────────

func (r *postgresRepository) ListFormerVendors(ctx context.Context, params ListFormerVendorsParams) ([]FormerVendorRow, int, error) {
	offset := (params.Page - 1) * params.Limit

	conditions := []string{}
	args := []any{}
	argIdx := 1

	if params.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(fv.stall_name ILIKE $%d OR fv.owner_name ILIKE $%d OR fv.email ILIKE $%d)",
			argIdx, argIdx, argIdx,
		))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	if params.DateFrom != "" {
		t, err := time.Parse("2006-01-02", params.DateFrom)
		if err == nil {
			conditions = append(conditions, fmt.Sprintf("fv.removed_at >= $%d", argIdx))
			args = append(args, t)
			argIdx++
		}
	}
	if params.DateTo != "" {
		t, err := time.Parse("2006-01-02", params.DateTo)
		if err == nil {
			t = t.Add(24*time.Hour - time.Second)
			conditions = append(conditions, fmt.Sprintf("fv.removed_at <= $%d", argIdx))
			args = append(args, t)
			argIdx++
		}
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM former_vendors fv %s`, where)
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("ListFormerVendors count: %w", err)
	}

	args = append(args, params.Limit, offset)
	dataQuery := fmt.Sprintf(`
		SELECT
			fv.id,
			fv.stall_name,
			fv.email,
			fv.owner_name,
			COALESCE(CONCAT(ui.first_name, ' ', ui.last_name), 'Unknown') AS removed_by,
			fv.removed_at
		FROM former_vendors fv
		LEFT JOIN users u ON u.id = fv.removed_by
		LEFT JOIN users_info ui ON ui.user_id = u.id
		%s
		ORDER BY fv.removed_at DESC
		LIMIT $%d OFFSET $%d`, where, argIdx, argIdx+1)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("ListFormerVendors query: %w", err)
	}
	defer rows.Close()

	var result []FormerVendorRow
	for rows.Next() {
		var fv FormerVendorRow
		var removedAt time.Time
		if err := rows.Scan(
			&fv.ID, &fv.StallName, &fv.Email, &fv.OwnerName, &fv.RemovedBy, &removedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("ListFormerVendors scan: %w", err)
		}
		fv.RemovedAt = removedAt.Format(time.RFC3339)
		result = append(result, fv)
	}

	if result == nil {
		result = []FormerVendorRow{}
	}
	return result, total, nil
}

// ── GetFormerVendorDetail ─────────────────────────────────────────────────────

func (r *postgresRepository) GetFormerVendorDetail(ctx context.Context, formerVendorID string) (*FormerVendorDetail, error) {
	query := `
		SELECT
			fv.id,
			fv.vendor_id,
			fv.stall_name,
			fv.email,
			fv.owner_name,
			COALESCE(CONCAT(ui.first_name, ' ', ui.last_name), 'Unknown') AS removed_by,
			fv.removed_at,
			fv.reasons,
			fv.personal_info_snapshot,
			fv.business_info_snapshot,
			fv.ledger_summary
		FROM former_vendors fv
		LEFT JOIN users u ON u.id = fv.removed_by
		LEFT JOIN users_info ui ON ui.user_id = u.id
		WHERE fv.id = $1
		LIMIT 1`

	var d FormerVendorDetail
	var removedAt time.Time
	var reasonsRaw, personalRaw, businessRaw, ledgerRaw []byte

	err := r.db.QueryRowContext(ctx, query, formerVendorID).Scan(
		&d.ID, &d.VendorID, &d.StallName, &d.Email, &d.OwnerName,
		&d.RemovedBy, &removedAt,
		&reasonsRaw, &personalRaw, &businessRaw, &ledgerRaw,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrFormerVendorNotFound
		}
		return nil, fmt.Errorf("GetFormerVendorDetail: %w", err)
	}

	d.RemovedAt = removedAt.Format(time.RFC3339)

	// Parse reasons JSONB
	type reasonsPayload struct {
		Selected    []string `json:"selected"`
		OtherReason string   `json:"other_reason,omitempty"`
	}
	var rp reasonsPayload
	if err := json.Unmarshal(reasonsRaw, &rp); err == nil {
		d.Reasons = rp.Selected
		if rp.OtherReason != "" {
			d.OtherReason = &rp.OtherReason
		}
	}

	// Leave personal/business/ledger as raw JSON for the frontend
	var pi, bi, li interface{}
	_ = json.Unmarshal(personalRaw, &pi)
	_ = json.Unmarshal(businessRaw, &bi)
	_ = json.Unmarshal(ledgerRaw, &li)
	d.PersonalInfo = pi
	d.BusinessInfo = bi
	d.LedgerSummary = li

	return &d, nil
}

// ── GetFormerVendorLedgerRows (for CSV export) ────────────────────────────────

func (r *postgresRepository) GetFormerVendorLedgerRows(ctx context.Context, vendorID string) ([]LedgerCSVRow, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			id::TEXT,
			entry_type::TEXT,
			amount,
			direction,
			amount * direction AS signed_amount,
			COALESCE(billing_month::TEXT, ''),
			COALESCE(reference_id::TEXT, ''),
			COALESCE(reference_type, ''),
			COALESCE(note, ''),
			created_at
		FROM vendors_ledger
		WHERE vendor_id = $1
		ORDER BY created_at ASC`, vendorID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetFormerVendorLedgerRows: %w", err)
	}
	defer rows.Close()

	var result []LedgerCSVRow
	for rows.Next() {
		var row LedgerCSVRow
		var createdAt time.Time
		if err := rows.Scan(
			&row.ID, &row.EntryType, &row.Amount, &row.Direction, &row.SignedAmount,
			&row.BillingMonth, &row.ReferenceID, &row.ReferenceType, &row.Note, &createdAt,
		); err != nil {
			return nil, fmt.Errorf("GetFormerVendorLedgerRows scan: %w", err)
		}
		row.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, row)
	}
	if result == nil {
		result = []LedgerCSVRow{}
	}
	return result, nil
}

// ── Notifications ─────────────────────────────────────────────────────────────

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

// ── pagination helper ─────────────────────────────────────────────────────────

func totalPages(total, limit int) int {
	if limit == 0 {
		return 1
	}
	return int(math.Ceil(float64(total) / float64(limit)))
}
