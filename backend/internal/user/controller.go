package user

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

func (c *Controller) GetUser(ctx *gin.Context) {
	userID := ctx.Param("id")
	if userID == "" {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "missing_user_id",
				Message: "User ID is required",
			},
		})
		return
	}

	res, err := c.uc.GetUser(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "user_not_found",
					Message: "User not found",
				},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "internal_error",
				Message: "An unexpected error occurred",
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{
		Success: true,
		Data:    res,
	})
}