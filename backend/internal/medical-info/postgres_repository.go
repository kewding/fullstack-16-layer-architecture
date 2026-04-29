package medicalinfo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/lib/pq"
)

type postgresRepository struct {
	db *sql.DB
}

var _ Repository = (*postgresRepository)(nil)

func NewPostgresRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

func (r *postgresRepository) GetMedicalInfo(ctx context.Context, userID string) (*MedicalInfoResponse, error) {
	query := `
		SELECT
			COALESCE(blood_type::TEXT, ''),
			COALESCE(height_cm, 0),
			COALESCE(weight_kg, 0),
			allergens,
			custom_allergens,
			medical_conditions,
			medications,
			COALESCE(emergency_contact_name, ''),
			COALESCE(emergency_contact_number, ''),
			COALESCE(emergency_contact_relationship, '')
		FROM medical_information
		WHERE user_id = $1`

	var res MedicalInfoResponse
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&res.BloodType,
		&res.HeightCm,
		&res.WeightKg,
		pq.Array(&res.Allergens),
		pq.Array(&res.CustomAllergens),
		pq.Array(&res.MedicalConditions),
		pq.Array(&res.Medications),
		&res.EmergencyContactName,
		&res.EmergencyContactNumber,
		&res.EmergencyContactRelationship,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// return empty response — first time user
			return &MedicalInfoResponse{
				Allergens:         []string{},
				CustomAllergens:   []string{},
				MedicalConditions: []string{},
				Medications:       []string{},
			}, nil
		}
		return nil, fmt.Errorf("failed to get medical info: %w", err)
	}

	if res.Allergens == nil {
		res.Allergens = []string{}
	}
	if res.CustomAllergens == nil {
		res.CustomAllergens = []string{}
	}
	if res.MedicalConditions == nil {
		res.MedicalConditions = []string{}
	}
	if res.Medications == nil {
		res.Medications = []string{}
	}

	return &res, nil
}

func (r *postgresRepository) UpsertMedicalInfo(ctx context.Context, userID string, req MedicalInfoRequest) error {
	query := `
		INSERT INTO medical_information (
			user_id, blood_type, height_cm, weight_kg,
			allergens, custom_allergens, medical_conditions, medications,
			emergency_contact_name, emergency_contact_number, emergency_contact_relationship
		) VALUES ($1, NULLIF($2, '')::blood_type, NULLIF($3, 0), NULLIF($4, 0),
			$5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (user_id) DO UPDATE SET
			blood_type = NULLIF($2, '')::blood_type,
			height_cm = NULLIF($3, 0),
			weight_kg = NULLIF($4, 0),
			allergens = $5,
			custom_allergens = $6,
			medical_conditions = $7,
			medications = $8,
			emergency_contact_name = $9,
			emergency_contact_number = $10,
			emergency_contact_relationship = $11,
			updated_at = NOW()`

	allergens := req.Allergens
	if allergens == nil {
		allergens = []string{}
	}
	customAllergens := req.CustomAllergens
	if customAllergens == nil {
		customAllergens = []string{}
	}
	medicalConditions := req.MedicalConditions
	if medicalConditions == nil {
		medicalConditions = []string{}
	}
	medications := req.Medications
	if medications == nil {
		medications = []string{}
	}

	_, err := r.db.ExecContext(ctx, query,
		userID,
		req.BloodType,
		req.HeightCm,
		req.WeightKg,
		pq.Array(allergens),
		pq.Array(customAllergens),
		pq.Array(medicalConditions),
		pq.Array(medications),
		req.EmergencyContactName,
		req.EmergencyContactNumber,
		req.EmergencyContactRelationship,
	)
	if err != nil {
		return fmt.Errorf("failed to upsert medical info: %w", err)
	}

	return nil
}