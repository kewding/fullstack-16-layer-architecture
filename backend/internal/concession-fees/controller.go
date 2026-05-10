
package concessionfees

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
)

type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

// GET /api/admin/concession-fees
func (c *Controller) GetFees(ctx *gin.Context) {
	res, err := c.uc.GetFees(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// POST /api/admin/concession-fees/:fee_type
func (c *Controller) SetFee(ctx *gin.Context) {
	feeType := FeeType(ctx.Param("fee_type"))
	userID := ctx.GetString("user_id")

	var req SetFeeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_body", Message: "Failed to parse request body"},
		})
		return
	}

	if req.Amount < 0 {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_amount", Message: "Amount must be zero or positive"},
		})
		return
	}

	res, err := c.uc.SetFee(ctx.Request.Context(), feeType, req.Amount, userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidFeeType):
			ctx.JSON(http.StatusBadRequest, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "invalid_fee_type", Message: "Invalid fee type. Must be one of: utility_charges, maintenance_rent, insurance_administrative, performance_security"},
			})
		case errors.Is(err, ErrFeeAlreadySetForNextMonth):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "fee_locked", Message: "This fee has already been set for next month and cannot be changed until the 1st of next month"},
			})
		default:
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
			})
		}
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}