package medicalinfo

import "context"

type Repository interface {
	GetMedicalInfo(ctx context.Context, userID string) (*MedicalInfoResponse, error)
	UpsertMedicalInfo(ctx context.Context, userID string, req MedicalInfoRequest) error
}