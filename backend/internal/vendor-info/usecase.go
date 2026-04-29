package vendorinfo

import (
	"context"
	"fmt"
	"mime/multipart"

	"github.com/kewding/backend/internal/infra/cloudinary"
)

type UseCase interface {
	GetPersonalInfo(ctx context.Context, userID string) (*PersonalInfoResponse, error)
	UpdatePersonalInfo(ctx context.Context, userID string, req PersonalInfoRequest) error
	GetBusinessInfo(ctx context.Context, userID string) (*BusinessInfoResponse, error)
	UpsertBusinessInfo(ctx context.Context, userID string, req BusinessInfoRequest) error
	UploadDocument(ctx context.Context, userID string, docType string, file multipart.File, filename string) error
}

type vendorInfoUseCase struct {
	repo     Repository
	uploader *cloudinary.Uploader
}

func NewUseCase(repo Repository, uploader *cloudinary.Uploader) UseCase {
	return &vendorInfoUseCase{repo: repo, uploader: uploader}
}

func (uc *vendorInfoUseCase) GetPersonalInfo(ctx context.Context, userID string) (*PersonalInfoResponse, error) {
	return uc.repo.GetPersonalInfo(ctx, userID)
}

func (uc *vendorInfoUseCase) UpdatePersonalInfo(ctx context.Context, userID string, req PersonalInfoRequest) error {
	return uc.repo.UpdatePersonalInfo(ctx, userID, req)
}

func (uc *vendorInfoUseCase) GetBusinessInfo(ctx context.Context, userID string) (*BusinessInfoResponse, error) {
	return uc.repo.GetBusinessInfo(ctx, userID)
}

func (uc *vendorInfoUseCase) UpsertBusinessInfo(ctx context.Context, userID string, req BusinessInfoRequest) error {
	return uc.repo.UpsertBusinessInfo(ctx, userID, req)
}

func (uc *vendorInfoUseCase) UploadDocument(ctx context.Context, userID string, docType string, file multipart.File, filename string) error {
	url, err := uc.uploader.UploadFile(ctx, file, fmt.Sprintf("%s_%s", userID, filename))
	if err != nil {
		return fmt.Errorf("failed to upload document: %w", err)
	}

	return uc.repo.UpdateDocumentURL(ctx, userID, docType, url)
}
