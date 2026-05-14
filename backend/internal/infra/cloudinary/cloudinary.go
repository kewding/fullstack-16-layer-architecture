package cloudinary

import (
	"context"
	"fmt"
	"log"
	"mime/multipart"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type Uploader struct {
	cld *cloudinary.Cloudinary
}

func NewUploader(cloudName, apiKey, apiSecret string) (*Uploader, error) {
	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize cloudinary: %w", err)
	}
	return &Uploader{cld: cld}, nil
}

func (u *Uploader) UploadFile(ctx context.Context, file multipart.File, filename string) (string, error) {
	uploadResult, err := u.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:       "vendor-documents",
		PublicID:     filename,
		ResourceType: "auto",
		Type:         "upload",
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file to cloudinary: %w", err)
	}

	// Add this:
	log.Printf("[Cloudinary] PublicID=%q SecureURL=%q Error=%+v AssetID=%q",
		uploadResult.PublicID,
		uploadResult.SecureURL,
		uploadResult.Error,
		uploadResult.AssetID,
	)

	if uploadResult.SecureURL == "" {
		return "", fmt.Errorf("cloudinary returned empty URL for file: %s", filename)
	}

	return uploadResult.SecureURL, nil
}
