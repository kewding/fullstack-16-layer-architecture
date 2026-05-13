package vendordashboard

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

// resolveVendorID extracts user_id from JWT context and resolves to vendor ID.
func (c *Controller) resolveVendorID(ctx *gin.Context) (string, bool) {
	userID := ctx.GetString("user_id")
	if userID == "" {
		ctx.JSON(http.StatusUnauthorized, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "unauthorized", Message: "Not authenticated"},
		})
		return "", false
	}
	vendorID, err := c.uc.GetVendorIDByUserID(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrVendorNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: "No vendor account found for this user"},
			})
			return "", false
		}
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return "", false
	}
	return vendorID, true
}

// GET /api/vendor-auth/dashboard/daily-profit
func (c *Controller) GetDailyProfitCard(ctx *gin.Context) {
	vendorID, ok := c.resolveVendorID(ctx)
	if !ok {
		return
	}
	res, err := c.uc.GetDailyProfitCard(ctx.Request.Context(), vendorID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/vendor-auth/dashboard/wallet
func (c *Controller) GetWalletCard(ctx *gin.Context) {
	vendorID, ok := c.resolveVendorID(ctx)
	if !ok {
		return
	}
	res, err := c.uc.GetWalletCard(ctx.Request.Context(), vendorID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/vendor-auth/dashboard/top-selling
func (c *Controller) GetTopSelling(ctx *gin.Context) {
	vendorID, ok := c.resolveVendorID(ctx)
	if !ok {
		return
	}
	res, err := c.uc.GetTopSelling(ctx.Request.Context(), vendorID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/vendor-auth/dashboard/top-rated
func (c *Controller) GetTopRated(ctx *gin.Context) {
	vendorID, ok := c.resolveVendorID(ctx)
	if !ok {
		return
	}
	res, err := c.uc.GetTopRated(ctx.Request.Context(), vendorID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/vendor-auth/dashboard/allergen-count
func (c *Controller) GetAllergenCount(ctx *gin.Context) {
	vendorID, ok := c.resolveVendorID(ctx)
	if !ok {
		return
	}
	res, err := c.uc.GetAllergenCount(ctx.Request.Context(), vendorID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/vendor-auth/dashboard/allergen-table
func (c *Controller) GetAllergenTable(ctx *gin.Context) {
	vendorID, ok := c.resolveVendorID(ctx)
	if !ok {
		return
	}
	res, err := c.uc.GetAllergenTable(ctx.Request.Context(), vendorID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}