package user

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/lib/pq"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

func (r *postgresRepository) GetUserByID(ctx context.Context, userID string) (*GetUserResponse, error) {
	query := `
		SELECT u.id, ui.first_name, ui.middle_name, ui.last_name
		FROM users u
		JOIN users_info ui ON ui.user_id = u.id
		WHERE u.id = $1 AND u.deleted_at IS NULL
		LIMIT 1`

	var res GetUserResponse
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&res.UserID,
		&res.FirstName,
		&res.MiddleName,
		&res.LastName,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user %s: %w", userID, err)
	}

	return &res, nil
}

func (r *postgresRepository) GetWallet(ctx context.Context, userID string) (*WalletResponse, error) {
	query := `
		SELECT 
			w.balance,
			t.amount,
			t.created_at
		FROM wallets w
		LEFT JOIN LATERAL (
			SELECT amount, created_at
			FROM top_up_transactions
			WHERE user_id = $1
			ORDER BY created_at DESC
			LIMIT 1
		) t ON true
		WHERE w.user_id = $1`

	var res WalletResponse
	var lastAmount *float64
	var lastDate *string

	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&res.Balance,
		&lastAmount,
		&lastDate,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrWalletNotFound
		}
		return nil, fmt.Errorf("failed to get wallet for user %s: %w", userID, err)
	}

	res.LastTopupAmount = lastAmount
	res.LastTopupDate = lastDate

	return &res, nil
}

func (r *postgresRepository) GetAdminInfo(ctx context.Context, userID string) (*AdminInfoResponse, error) {
	query := `
		SELECT ui.first_name, ui.middle_name, ui.last_name,
		       ui.birth_date, ui.contact_no
		FROM users_info ui
		WHERE ui.user_id = $1
		LIMIT 1`

	var res AdminInfoResponse
	var birthDate time.Time
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&res.FirstName,
		&res.MiddleName,
		&res.LastName,
		&birthDate,
		&res.ContactNumber,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get admin info: %w", err)
	}

	res.BirthDate = birthDate.Format("2006-01-02")
	return &res, nil
}

func (r *postgresRepository) UpdateAdminInfo(ctx context.Context, userID string, req UpdateAdminInfoRequest) error {
	birthDate, err := time.Parse("2006-01-02", req.BirthDate)
	if err != nil {
		return fmt.Errorf("invalid birth date format: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		UPDATE users_info
		SET first_name = $1, middle_name = $2, last_name = $3,
		    birth_date = $4, contact_no = $5
		WHERE user_id = $6`,
		req.FirstName, req.MiddleName, req.LastName,
		birthDate, req.ContactNumber, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to update admin info: %w", err)
	}

	return nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

func nullStringPtr(ns sql.NullString) *string {
	if ns.Valid {
		return &ns.String
	}
	return nil
}

func nullFloat64Ptr(nf sql.NullFloat64) *float64 {
	if nf.Valid {
		return &nf.Float64
	}
	return nil
}

func nullBoolPtr(nb sql.NullBool) *bool {
	if nb.Valid {
		return &nb.Bool
	}
	return nil
}

// ── ListCustomers ─────────────────────────────────────────────────────────────

func (r *postgresRepository) ListCustomers(ctx context.Context, req ListCustomersRequest) (*ListCustomersResponse, error) {
	if req.Page < 1 {
		req.Page = 1
	}
	if req.Limit < 1 {
		req.Limit = 20
	}
	offset := (req.Page - 1) * req.Limit

	args := []any{}
	argIdx := 1
	conditions := []string{}

	// role = customer
	conditions = append(conditions, fmt.Sprintf("ur.slug = $%d", argIdx))
	args = append(args, "customer")
	argIdx++

	// active vs inactive
	if req.Active {
		conditions = append(conditions, "u.deleted_at IS NULL")
	} else {
		conditions = append(conditions, "u.deleted_at IS NOT NULL")
	}

	// name search
	if req.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(ui.first_name ILIKE $%d OR ui.middle_name ILIKE $%d OR ui.last_name ILIKE $%d)",
			argIdx, argIdx, argIdx,
		))
		args = append(args, "%"+req.Search+"%")
		argIdx++
	}

	// date range — created_at for active, deleted_at for inactive
	dateCol := "u.created_at"
	if !req.Active {
		dateCol = "u.deleted_at"
	}
	if req.DateFrom != "" {
		from, err := time.Parse("2006-01-02", req.DateFrom)
		if err == nil {
			conditions = append(conditions, fmt.Sprintf("%s >= $%d", dateCol, argIdx))
			args = append(args, from)
			argIdx++
		}
	}
	if req.DateTo != "" {
		to, err := time.Parse("2006-01-02", req.DateTo)
		if err == nil {
			to = to.Add(24*time.Hour - time.Second)
			conditions = append(conditions, fmt.Sprintf("%s <= $%d", dateCol, argIdx))
			args = append(args, to)
			argIdx++
		}
	}

	where := "WHERE " + strings.Join(conditions, " AND ")

	// ---------- COUNT ----------
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM users u
		JOIN user_roles    ur  ON ur.id      = u.role_id
		JOIN users_info    ui  ON ui.user_id  = u.id
		JOIN users_inst_id uii ON uii.user_id = u.id
		%s`, where)

	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("ListCustomers count: %w", err)
	}

	// ---------- DATA ----------
	limitArg := argIdx
	offsetArg := argIdx + 1
	args = append(args, req.Limit, offset)

	dataQuery := fmt.Sprintf(`
		SELECT
			u.id,
			uii.inst_id,
			ui.first_name,
			ui.middle_name,
			ui.last_name,
			COALESCE(ui.customer_role::TEXT, ''),
			u.created_at,
			u.deleted_at
		FROM users u
		JOIN user_roles    ur  ON ur.id      = u.role_id
		JOIN users_info    ui  ON ui.user_id  = u.id
		JOIN users_inst_id uii ON uii.user_id = u.id
		%s
		ORDER BY u.created_at DESC
		LIMIT $%d OFFSET $%d`, where, limitArg, offsetArg)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("ListCustomers query: %w", err)
	}
	defer rows.Close()

	customers := []CustomerRow{}
	for rows.Next() {
		var c CustomerRow
		var deletedAt sql.NullTime
		var roleStr string
		var createdAt time.Time
		if err := rows.Scan(
			&c.UserID,
			&c.InstID,
			&c.FirstName,
			&c.MiddleName,
			&c.LastName,
			&roleStr,
			&createdAt,
			&deletedAt,
		); err != nil {
			return nil, fmt.Errorf("ListCustomers scan: %w", err)
		}
		c.CustomerRole = CustomerRole(roleStr)
		c.CreatedAt = createdAt.Format(time.RFC3339)
		if deletedAt.Valid {
			s := deletedAt.Time.Format(time.RFC3339)
			c.DeletedAt = &s
		}
		customers = append(customers, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ListCustomers rows: %w", err)
	}

	totalPages := int(math.Ceil(float64(total) / float64(req.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &ListCustomersResponse{
		Data:       customers,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

// ── GetCustomerDetail ─────────────────────────────────────────────────────────

func (r *postgresRepository) GetCustomerDetail(ctx context.Context, userID string) (*CustomerDetailResponse, error) {
	// Key fixes vs previous version:
	//   1. blood_type: cast to TEXT *before* COALESCE so the NULL from a missing
	//      LEFT JOIN row doesn't force Postgres to resolve an ambiguous enum cast.
	//   2. TEXT[] arrays: use ARRAY[]::TEXT[] as the COALESCE fallback so Postgres
	//      knows the type even when the entire medical_information row is NULL.
	//   3. All LEFT-JOIN nullable scalars use sql.NullXxx — no direct *string scan.
	query := `
		SELECT
			u.id,
			u.email,
			uii.inst_id,
			ui.first_name,
			ui.middle_name,
			ui.last_name,
			ui.birth_date,
			ui.contact_no,
			COALESCE(ui.customer_role::TEXT, ''),
			u.created_at,
			rfid.rfid_tag,
			rfid.is_active,
			COALESCE(mi.blood_type::TEXT,        ''),
			mi.height_cm,
			mi.weight_kg,
			COALESCE(mi.allergens,          ARRAY[]::TEXT[]),
			COALESCE(mi.custom_allergens,   ARRAY[]::TEXT[]),
			COALESCE(mi.medical_conditions, ARRAY[]::TEXT[]),
			COALESCE(mi.medications,        ARRAY[]::TEXT[]),
			mi.emergency_contact_name,
			mi.emergency_contact_number,
			mi.emergency_contact_relationship
		FROM users u
		JOIN users_info    ui  ON ui.user_id  = u.id
		JOIN users_inst_id uii ON uii.user_id = u.id
		LEFT JOIN users_rfid          rfid ON rfid.user_id = u.id
		LEFT JOIN medical_information mi   ON mi.user_id   = u.id
		WHERE u.id = $1
		LIMIT 1`

	var d CustomerDetailResponse
	var birthDate time.Time
	var createdAt time.Time
	var rfidTag sql.NullString
	var rfidActive sql.NullBool
	// blood_type is now COALESCE'd to '' so we scan into a plain string,
	// then convert empty string back to nil for the JSON response.
	var bloodTypeStr string
	var heightCM sql.NullFloat64
	var weightKG sql.NullFloat64
	var allergens, customAllergens, medicalConditions, medications []string
	var ecName, ecNumber, ecRel sql.NullString
	var roleStr string

	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&d.UserID,
		&d.Email,
		&d.InstID,
		&d.FirstName,
		&d.MiddleName,
		&d.LastName,
		&birthDate,
		&d.ContactNo,
		&roleStr,
		&createdAt,
		&rfidTag,
		&rfidActive,
		&bloodTypeStr,
		&heightCM,
		&weightKG,
		pq.Array(&allergens),
		pq.Array(&customAllergens),
		pq.Array(&medicalConditions),
		pq.Array(&medications),
		&ecName,
		&ecNumber,
		&ecRel,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("GetCustomerDetail: %w", err)
	}

	d.BirthDate = birthDate.Format("2006-01-02")
	d.CreatedAt = createdAt.Format(time.RFC3339)
	d.CustomerRole = CustomerRole(roleStr)
	d.RFIDTag = nullStringPtr(rfidTag)
	d.RFIDIsActive = nullBoolPtr(rfidActive)

	// Convert empty-string sentinel back to nil pointer for JSON
	if bloodTypeStr != "" {
		d.BloodType = &bloodTypeStr
	}

	d.HeightCM = nullFloat64Ptr(heightCM)
	d.WeightKG = nullFloat64Ptr(weightKG)

	// pq.Array scans into nil slice when column is NULL; normalise to empty slice
	// so the JSON response always has [] not null.
	if allergens == nil {
		allergens = []string{}
	}
	if customAllergens == nil {
		customAllergens = []string{}
	}
	if medicalConditions == nil {
		medicalConditions = []string{}
	}
	if medications == nil {
		medications = []string{}
	}

	d.Allergens = allergens
	d.CustomAllergens = customAllergens
	d.MedicalConditions = medicalConditions
	d.Medications = medications
	d.EmergencyContactName = nullStringPtr(ecName)
	d.EmergencyContactNumber = nullStringPtr(ecNumber)
	d.EmergencyContactRelationship = nullStringPtr(ecRel)

	return &d, nil
}

// ── DisableCustomer ───────────────────────────────────────────────────────────

func (r *postgresRepository) DisableCustomer(ctx context.Context, userID string) error {
	res, err := r.db.ExecContext(ctx, `
		UPDATE users SET deleted_at = now()
		WHERE id = $1 AND deleted_at IS NULL`, userID)
	if err != nil {
		return fmt.Errorf("DisableCustomer: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrUserNotFound
	}
	return nil
}

// ── ReactivateCustomer ────────────────────────────────────────────────────────

func (r *postgresRepository) ReactivateCustomer(ctx context.Context, userID string) error {
	res, err := r.db.ExecContext(ctx, `
		UPDATE users SET deleted_at = NULL
		WHERE id = $1 AND deleted_at IS NOT NULL`, userID)
	if err != nil {
		return fmt.Errorf("ReactivateCustomer: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrUserNotFound
	}
	return nil
}
