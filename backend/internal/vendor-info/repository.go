package vendorinfo

import "context"

type Repository interface {
	GetPersonalInfo(ctx context.Context, userID string) (*PersonalInfoResponse, error)
	UpdatePersonalInfo(ctx context.Context, userID string, req PersonalInfoRequest) error
	GetBusinessInfo(ctx context.Context, userID string) (*BusinessInfoResponse, error)
	UpsertBusinessInfo(ctx context.Context, userID string, req BusinessInfoRequest) error
	UpdateDocumentURL(ctx context.Context, userID string, docType string, url string) error
}