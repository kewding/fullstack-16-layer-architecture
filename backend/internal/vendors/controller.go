package vendors

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
)

type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

func (c *Controller) ListVendorsReview(ctx *gin.Context) {
	params := ListVendorsParams{
		Search: ctx.Query("search"),
		Status: VendorStatusFilter(ctx.Query("status")),
		Page:   parseIntQuery(ctx.Query("page"), 1),
		Limit:  10,
	}

	res, err := c.uc.ListVendorsReview(ctx.Request.Context(), params)
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

func (c *Controller) ListVendorsBalance(ctx *gin.Context) {
	params := ListVendorsParams{
		Search: ctx.Query("search"),
		Page:   parseIntQuery(ctx.Query("page"), 1),
		Limit:  10,
	}

	res, err := c.uc.ListVendorsBalance(ctx.Request.Context(), params)
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

func parseIntQuery(val string, fallback int) int {
	if val == "" {
		return fallback
	}
	n, err := strconv.Atoi(val)
	if err != nil || n < 1 {
		return fallback
	}
	return n
}