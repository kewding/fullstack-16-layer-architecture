package medicalinfo

import "context"

type UseCase interface {
	GetMedicalInfo(ctx context.Context, userID string) (*MedicalInfoResponse, error)
	UpsertMedicalInfo(ctx context.Context, userID string, req MedicalInfoRequest) error
}

type medicalInfoUseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &medicalInfoUseCase{repo: repo}
}

func (uc *medicalInfoUseCase) GetMedicalInfo(ctx context.Context, userID string) (*MedicalInfoResponse, error) {
	return uc.repo.GetMedicalInfo(ctx, userID)
}

func (uc *medicalInfoUseCase) UpsertMedicalInfo(ctx context.Context, userID string, req MedicalInfoRequest) error {
	return uc.repo.UpsertMedicalInfo(ctx, userID, req)
}
