package vendorinfo

import (
	"log"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
	"github.com/kewding/backend/internal/validation"
)

type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

func (c *Controller) GetPersonalInfo(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	res, err := c.uc.GetPersonalInfo(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrVendorInfoNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_found", Message: "Vendor info not found"},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

func (c *Controller) UpdatePersonalInfo(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	var req PersonalInfoRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_request_body", Message: "Failed to parse request body"},
		})
		return
	}

	if err := validation.Validator.Struct(req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "validation_error", Message: err.Error()},
		})
		return
	}

	if err := c.uc.UpdatePersonalInfo(ctx.Request.Context(), userID, req); err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}

func (c *Controller) GetBusinessInfo(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	res, err := c.uc.GetBusinessInfo(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

func (c *Controller) UpsertBusinessInfo(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	var req BusinessInfoRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_request_body", Message: "Failed to parse request body"},
		})
		return
	}

	if err := c.uc.UpsertBusinessInfo(ctx.Request.Context(), userID, req); err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}

func (c *Controller) UploadDocument(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	docType := ctx.Param("type")

	file, header, err := ctx.Request.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "missing_file", Message: "No file provided"},
		})
		return
	}
	defer file.Close()

	if header.Size > 10<<20 { // 10MB limit
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "file_too_large", Message: "File must be under 10MB"},
		})
		return
	}

	if err := c.uc.UploadDocument(
		ctx.Request.Context(),
		userID,
		docType,
		file,
		header.Filename,
	); err != nil {
		log.Printf("UploadDocument error: %v", err)
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "upload_failed", Message: "Failed to upload document"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}
//