package vendorwithdrawal

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/kewding/backend/internal/response"
)

type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
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

// ── vendor endpoints ──────────────────────────────────────────────────────────

// GET /api/vendor-auth/withdraw/balance
func (c *Controller) GetWalletBalance(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	balance, err := c.uc.GetWalletBalance(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: gin.H{"balance": balance}})
}

// POST /api/vendor-auth/withdraw/request
func (c *Controller) SubmitRequest(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	var req SubmitVendorWithdrawalRequest
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

	pending, err := c.uc.SubmitRequest(ctx.Request.Context(), userID, req.Amount)
	if err != nil {
		switch {
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
		case errors.Is(err, ErrVendorNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: err.Error()},
			})
		default:
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
			})
		}
		return
	}

	ctx.JSON(http.StatusCreated, response.APIResponse{Success: true, Data: pending})
}

// GET /api/vendor-auth/withdraw/pending
func (c *Controller) GetPendingRequest(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	pending, err := c.uc.GetPendingRequest(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: pending})
}

// DELETE /api/vendor-auth/withdraw/request/:id
func (c *Controller) CancelRequest(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	requestID := ctx.Param("id")

	if err := c.uc.CancelRequest(ctx.Request.Context(), requestID, userID); err != nil {
		if errors.Is(err, ErrNotPending) {
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_pending", Message: "Request is no longer pending and cannot be cancelled"},
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

// GET /api/vendor-auth/withdraw/history?page=&date_start=&date_end=
func (c *Controller) ListHistory(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	params := VendorWithdrawalHistoryParams{
		Page:      parseIntQuery(ctx.Query("page"), 1),
		Limit:     10,
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	}

	res, err := c.uc.ListHistory(ctx.Request.Context(), userID, params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// ── cashier endpoints ─────────────────────────────────────────────────────────

// GET /api/cashier/vendor-withdraw/requests
func (c *Controller) ListPendingRequests(ctx *gin.Context) {
	params := CashierVendorWithdrawalParams{
		Page:      parseIntQuery(ctx.Query("page"), 1),
		Limit:     10,
		Search:    ctx.Query("search"),
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	}
	res, err := c.uc.ListPendingRequests(ctx.Request.Context(), params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// PATCH /api/cashier/vendor-withdraw/request/:id/complete
func (c *Controller) CompleteRequest(ctx *gin.Context) {
	cashierID := ctx.GetString("user_id")
	requestID := ctx.Param("id")

	if err := c.uc.CompleteRequest(ctx.Request.Context(), requestID, cashierID); err != nil {
		switch {
		case errors.Is(err, ErrRequestNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "request_not_found", Message: err.Error()},
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

// PATCH /api/cashier/vendor-withdraw/request/:id/reject
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
		case errors.Is(err, ErrInvalidRejectionInput):
			ctx.JSON(http.StatusBadRequest, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "comment_required", Message: err.Error()},
			})
		case errors.Is(err, ErrRequestNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "request_not_found", Message: err.Error()},
			})
		case errors.Is(err, ErrNotPending):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_pending", Message: err.Error()},
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

// GET /api/cashier/vendor-withdraw/completed
func (c *Controller) ListCompletedRequests(ctx *gin.Context) {
	params := CashierVendorWithdrawalParams{
		Page:      parseIntQuery(ctx.Query("page"), 1),
		Limit:     10,
		Search:    ctx.Query("search"),
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	}
	res, err := c.uc.ListCompletedRequests(ctx.Request.Context(), params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/cashier/vendor-withdraw/rejected
func (c *Controller) ListRejectedRequests(ctx *gin.Context) {
	params := CashierVendorWithdrawalParams{
		Page:      parseIntQuery(ctx.Query("page"), 1),
		Limit:     10,
		Search:    ctx.Query("search"),
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	}
	res, err := c.uc.ListRejectedRequests(ctx.Request.Context(), params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/cashier/vendor-withdraw/pending-count
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

// GET /api/cashier/vendor-withdraw/ws
func (c *Controller) CashierVendorWithdrawWebSocket(ctx *gin.Context) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		count, err := c.uc.GetPendingCount(ctx.Request.Context())
		if err != nil {
			return
		}
		if err := conn.WriteJSON(gin.H{"pending_count": count}); err != nil {
			return
		}
	}
}