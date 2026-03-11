package rfidtagging

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
	"github.com/kewding/backend/internal/validation"
)

type Controller struct {
	usecase UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{usecase: uc}
}

func (c *Controller) RfidTagging(ctx *gin.Context) {
	var req RfidTaggingRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "invalid_request_body",
				Message: "Failed to parse request body",
			},
		})
		return
	}

	if err := validation.Validator.Struct(req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "validation_error",
				Message: err.Error(),
			},
		})
		return
	}

	if err := c.usecase.RfidTagging(ctx.Request.Context(), req); err != nil {
		switch {
		case errors.Is(err, ErrUuidNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error: &response.APIError{Code: "uuid_not_found", Message: err.Error()},
			})
		case errors.Is(err, ErrRfidTaken):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error: &response.APIError{Code: "rfid_already_taken", Message: err.Error()},
			})
		case errors.Is(err, ErrRfidPresent):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error: &response.APIError{Code: "user_already_has_rfid", Message: err.Error()},
			})
		case errors.Is(err, ErrRfidTaggingFailed):
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error: &response.APIError{Code: "tagging_failed", Message: "RFID tagging operation failed"},
			})
		default:
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error: &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
			})
		}
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}