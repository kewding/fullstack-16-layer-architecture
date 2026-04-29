package vendorinfo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

func (r *postgresRepository) GetPersonalInfo(ctx context.Context, userID string) (*PersonalInfoResponse, error) {
	query := `
		SELECT ui.first_name, ui.middle_name, ui.last_name,
		       ui.birth_date, ui.contact_no, s.stall_name
		FROM users_info ui
		JOIN stalls s ON s.user_id = ui.user_id
		WHERE ui.user_id = $1
		LIMIT 1`

	var res PersonalInfoResponse
	var birthDate time.Time
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&res.FirstName,
		&res.MiddleName,
		&res.LastName,
		&birthDate,
		&res.ContactNumber,
		&res.StallName,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrVendorInfoNotFound
		}
		return nil, fmt.Errorf("failed to get personal info: %w", err)
	}

	res.BirthDate = birthDate.Format("2006-01-02")
	return &res, nil
}

func (r *postgresRepository) UpdatePersonalInfo(ctx context.Context, userID string, req PersonalInfoRequest) error {
	birthDate, err := time.Parse("2006-01-02", req.BirthDate)
	if err != nil {
		return fmt.Errorf("invalid birth date format: %w", err)
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		UPDATE users_info
		SET first_name = $1, middle_name = $2, last_name = $3,
		    birth_date = $4, contact_no = $5
		WHERE user_id = $6`,
		req.FirstName, req.MiddleName, req.LastName,
		birthDate, req.ContactNumber, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to update users_info: %w", err)
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE stalls SET stall_name = $1 WHERE user_id = $2`,
		req.StallName, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to update stall name: %w", err)
	}

	return tx.Commit()
}

func (r *postgresRepository) GetBusinessInfo(ctx context.Context, userID string) (*BusinessInfoResponse, error) {
	query := `
		SELECT dti_sec_number, tin,
		       proof_of_business_address_url,
		       barangay_clearance_url,
		       mayors_permit_url,
		       is_dti_verified, is_tin_verified, is_documents_verified
		FROM vendor_business_info
		WHERE user_id = $1`

	var res BusinessInfoResponse
	var dti, tin sql.NullString
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&dti, &tin,
		&res.ProofOfBusinessAddressURL,
		&res.BarangayClearanceURL,
		&res.MayorsPermitURL,
		&res.IsDtiVerified,
		&res.IsTinVerified,
		&res.IsDocumentsVerified,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &BusinessInfoResponse{}, nil // return empty, not error
		}
		return nil, fmt.Errorf("failed to get business info: %w", err)
	}

	if dti.Valid {
		res.DtiSecNumber = dti.String
	}
	if tin.Valid {
		res.Tin = tin.String
	}

	return &res, nil
}

func (r *postgresRepository) UpsertBusinessInfo(ctx context.Context, userID string, req BusinessInfoRequest) error {
	query := `
		INSERT INTO vendor_business_info (user_id, dti_sec_number, tin)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id) DO UPDATE
		SET dti_sec_number = EXCLUDED.dti_sec_number,
		    tin = EXCLUDED.tin,
		    updated_at = NOW()`

	_, err := r.db.ExecContext(ctx, query, userID, req.DtiSecNumber, req.Tin)
	if err != nil {
		return fmt.Errorf("failed to upsert business info: %w", err)
	}
	return nil
}

func (r *postgresRepository) UpdateDocumentURL(ctx context.Context, userID string, docType string, url string) error {
	allowedCols := map[string]string{
		"business_address": "proof_of_business_address_url",
		"barangay":         "barangay_clearance_url",
		"mayors_permit":    "mayors_permit_url",
	}

	col, ok := allowedCols[docType]
	if !ok {
		return fmt.Errorf("invalid document type: %s", docType)
	}

	query := fmt.Sprintf(`
		INSERT INTO vendor_business_info (user_id, %s)
		VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE
		SET %s = EXCLUDED.%s, updated_at = NOW()`, col, col, col)

	_, err := r.db.ExecContext(ctx, query, userID, url)
	if err != nil {
		return fmt.Errorf("failed to update document url: %w", err)
	}
	return nil
}