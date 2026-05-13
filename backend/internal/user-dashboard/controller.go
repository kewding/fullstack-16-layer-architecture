package userdashboard

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
)

// Controller handles HTTP requests for the user dashboard.
type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

// GetNutritionData handles GET /api/customer/dashboard/nutrition
// Returns today's nutrition totals and user-specific daily limits.
func (c *Controller) GetNutritionData(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	res, err := c.uc.GetNutritionData(ctx.Request.Context(), userID)
	if err != nil {
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

// GetRecentPurchases handles GET /api/customer/dashboard/purchases
// Returns the 5 most recent completed/blocked sales items for the user.
func (c *Controller) GetRecentPurchases(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	res, err := c.uc.GetRecentPurchases(ctx.Request.Context(), userID)
	if err != nil {
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