package vendorsledger

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
)

type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

// GET /api/admin/vendor/:id/ledger
// GET /api/vendor-auth/ledger  (vendor sees their own)
func (c *Controller) GetLedger(ctx *gin.Context) {
	// Admin path uses :id param; vendor-auth path uses user's vendor_id from context.
	vendorID := ctx.Param("id")

	// For the vendor-auth route, :id is empty — resolve from the authenticated user_id.
	if vendorID == "" {
		userID := ctx.GetString("user_id")
		if userID == "" {
			ctx.JSON(http.StatusUnauthorized, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "unauthorized", Message: "Not authenticated"},
			})
			return
		}
		resolvedID, err := c.uc.GetVendorIDByUserID(ctx.Request.Context(), userID)
		if err != nil {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: "No vendor account found for this user"},
			})
			return
		}
		vendorID = resolvedID
	}


	if vendorID == "" {
		vendorID = ctx.GetString("vendor_id") // set by auth middleware for vendor role
	}
	if vendorID == "" {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "missing_vendor_id", Message: "Vendor ID is required"},
		})
		return
	}

	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))

	res, err := c.uc.GetLedger(ctx.Request.Context(), vendorID, page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// POST /api/admin/ledger/post-monthly
// Body: { "billing_month": "2025-04-01" } — optional, defaults to previous month.
func (c *Controller) PostMonthly(ctx *gin.Context) {
	var req PostMonthlyRequest
	_ = ctx.ShouldBindJSON(&req) // ignore parse error — billing_month is optional

	billingMonth := req.BillingMonth
	if billingMonth == "" {
		// Default to previous calendar month
		billingMonth = previousMonthStr()
	}

	if err := c.uc.PostMonthlyEntries(ctx.Request.Context(), billingMonth); err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: err.Error()},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{
		Success: true,
		Data:    gin.H{"billing_month": billingMonth, "message": "Monthly entries posted successfully"},
	})
}

// previousMonthStr returns the 1st day of the previous calendar month as YYYY-MM-DD.
func previousMonthStr() string {
	now := time.Now().UTC()
	prev := now.AddDate(0, -1, 0)
	return fmt.Sprintf("%d-%02d-01", prev.Year(), prev.Month())
}