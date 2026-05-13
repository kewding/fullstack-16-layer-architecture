package productratings

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

// POST /api/customer/ratings
func (c *Controller) SubmitRating(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	var req SubmitRatingRequest
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

	res, err := c.uc.SubmitRating(ctx.Request.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotPurchased):
			ctx.JSON(http.StatusForbidden, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_purchased", Message: err.Error()},
			})
		case errors.Is(err, ErrInvalidRating):
			ctx.JSON(http.StatusBadRequest, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "invalid_rating", Message: err.Error()},
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
