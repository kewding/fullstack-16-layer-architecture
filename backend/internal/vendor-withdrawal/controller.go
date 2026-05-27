package vendorwithdrawal

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
)

// Controller handles all HTTP routes for the vendor withdrawal feature.
type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

// ── vendor routes ─────────────────────────────────────────────────────────────

// GET /api/vendor-auth/withdraw/balance
func (c *Controller) GetWalletBalance(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	balance, err := c.uc.GetWalletBalance(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrVendorNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: "Vendor account not found"},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{
		Success: true,
		Data:    WalletBalanceResponse{Balance: balance},
	})
}

// POST /api/vendor-auth/withdraw/request
func (c *Controller) SubmitRequest(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	var req SubmitWithdrawalRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_request_body", Message: "Failed to parse request body"},
		})
		return
	}

	if req.Amount <= 0 {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_amount", Message: "Amount must be greater than zero"},
		})
		return
	}

	res, err := c.uc.SubmitRequest(ctx.Request.Context(), userID, req.Amount)
	if err != nil {
		switch {
		case errors.Is(err, ErrVendorNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: err.Error()},
			})
		case errors.Is(err, ErrPendingRequestExists):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "pending_request_exists", Message: err.Error()},
			})
		case errors.Is(err, ErrAmountExceedsBalance):
			ctx.JSON(http.StatusUnprocessableEntity, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "amount_exceeds_balance", Message: err.Error()},
			})
		case errors.Is(err, ErrMinimumAmount):
			ctx.JSON(http.StatusBadRequest, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "minimum_amount", Message: err.Error()},
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

// GET /api/vendor-auth/withdraw/pending
func (c *Controller) GetPendingRequest(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	res, err := c.uc.GetPendingRequest(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// DELETE /api/vendor-auth/withdraw/request/:id
func (c *Controller) CancelRequest(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	requestID := ctx.Param("id")

	if err := c.uc.CancelRequest(ctx.Request.Context(), requestID, userID); err != nil {
		if errors.Is(err, ErrNotPending) {
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_pending", Message: "Request is not pending and cannot be cancelled"},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}

// GET /api/vendor-auth/withdraw/history
func (c *Controller) ListHistory(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	res, err := c.uc.ListHistory(ctx.Request.Context(), userID, VendorWithdrawalHistoryParams{
		Page:      page,
		Limit:     limit,
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// ── cashier routes ────────────────────────────────────────────────────────────

// GET /api/cashier/vendor-remit/requests
func (c *Controller) ListPendingRequests(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	res, err := c.uc.ListPendingRequests(ctx.Request.Context(), CashierVendorWithdrawalParams{
		Page:      page,
		Limit:     limit,
		Search:    ctx.Query("search"),
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// PATCH /api/cashier/vendor-remit/request/:id/complete
func (c *Controller) CompleteRequest(ctx *gin.Context) {
	cashierID := ctx.GetString("user_id")
	requestID := ctx.Param("id")

	if err := c.uc.CompleteRequest(ctx.Request.Context(), requestID, cashierID); err != nil {
		switch {
		case errors.Is(err, ErrRequestNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_found", Message: err.Error()},
			})
		case errors.Is(err, ErrNotPending):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_pending", Message: err.Error()},
			})
		case errors.Is(err, ErrInsufficientBalance):
			ctx.JSON(http.StatusUnprocessableEntity, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "insufficient_balance", Message: err.Error()},
			})
		default:
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
			})
		}
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}

// PATCH /api/cashier/vendor-remit/request/:id/reject
func (c *Controller) RejectRequest(ctx *gin.Context) {
	cashierID := ctx.GetString("user_id")
	requestID := ctx.Param("id")

	var input RejectVendorWithdrawalInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_request_body", Message: "Failed to parse request body"},
		})
		return
	}

	if err := c.uc.RejectRequest(ctx.Request.Context(), requestID, cashierID, input); err != nil {
		switch {
		case errors.Is(err, ErrRequestNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_found", Message: err.Error()},
			})
		case errors.Is(err, ErrNotPending):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_pending", Message: err.Error()},
			})
		case errors.Is(err, ErrInvalidRejectionInput):
			ctx.JSON(http.StatusBadRequest, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "invalid_rejection_input", Message: err.Error()},
			})
		default:
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
			})
		}
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}

// GET /api/cashier/vendor-remit/completed
func (c *Controller) ListCompletedRequests(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	res, err := c.uc.ListCompletedRequests(ctx.Request.Context(), CashierVendorWithdrawalParams{
		Page:      page,
		Limit:     limit,
		Search:    ctx.Query("search"),
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/cashier/vendor-remit/rejected
func (c *Controller) ListRejectedRequests(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	res, err := c.uc.ListRejectedRequests(ctx.Request.Context(), CashierVendorWithdrawalParams{
		Page:      page,
		Limit:     limit,
		Search:    ctx.Query("search"),
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/cashier/vendor-remit/pending-count
func (c *Controller) GetPendingCount(ctx *gin.Context) {
	count, err := c.uc.GetPendingCount(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: gin.H{"count": count}})
}
