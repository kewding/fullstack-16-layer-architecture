package vendorregister

import (
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

func (c *Controller) Register(ctx *gin.Context) {
	var req VendorRegisterRequest

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

	if err := c.uc.Register(ctx.Request.Context(), req); err != nil {
		switch {
		case errors.Is(err, ErrInviteInvalid):
			ctx.JSON(http.StatusGone, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "invite_invalid",
					Message: "Invitation is invalid, expired, or already used",
				},
			})
		case errors.Is(err, ErrEmailExists):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "email_exists",
					Message: "An account with this email already exists",
				},
			})
		default:
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "internal_error",
					Message: "An unexpected error occurred",
				},
			})
		}
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}