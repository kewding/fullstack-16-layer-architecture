package topup

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

func (c *Controller) CreditTopup(ctx *gin.Context) {
	var req TopupCreditingRequest

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

	res, err := c.uc.CreditTopup(ctx.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrRfidUnregistered):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "rfid_unregistered",
					Message: "RFID tag is not registered to any user",
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

	ctx.JSON(http.StatusOK, response.APIResponse{
		Success: true,
		Data:    res,
	})
}

func (c *Controller) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/topup", c.CreditTopup)
}