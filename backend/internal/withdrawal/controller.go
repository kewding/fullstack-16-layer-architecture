package withdrawal

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

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── customer endpoints ────────────────────────────────────────────────────────

// POST /api/customer/withdraw/request
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

	if req.Amount <= 0 || req.Amount > 50000 {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_amount", Message: "Amount must be between ₱1 and ₱50,000"},
		})
		return
	}

	pending, err := c.uc.SubmitRequest(ctx.Request.Context(), userID, req.Amount)
	if err != nil {
		switch {
		case errors.Is(err, ErrPendingRequestExists):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "pending_request_exists", Message: "You already have a pending withdrawal request"},
			})
		case errors.Is(err, ErrAmountExceedsBalance):
			ctx.JSON(http.StatusUnprocessableEntity, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "amount_exceeds_balance", Message: "Withdrawal amount exceeds your current wallet balance"},
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

// GET /api/customer/withdraw/pending
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

// DELETE /api/customer/withdraw/request/:id
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

// GET /api/customer/withdraw/history?page=&date_start=&date_end=
func (c *Controller) ListHistory(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	params := WithdrawalHistoryParams{
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

// GET /api/cashier/withdraw/requests?page=&search=&date_start=&date_end=
func (c *Controller) ListPendingRequests(ctx *gin.Context) {
	params := CashierWithdrawalParams{
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

// PATCH /api/cashier/withdraw/request/:id/complete
func (c *Controller) CompleteRequest(ctx *gin.Context) {
	cashierID := ctx.GetString("user_id")
	requestID := ctx.Param("id")

	if err := c.uc.CompleteRequest(ctx.Request.Context(), requestID, cashierID); err != nil {
		switch {
		case errors.Is(err, ErrRequestNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "request_not_found", Message: "Withdrawal request not found"},
			})
		case errors.Is(err, ErrNotPending):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_pending", Message: "Request is no longer pending"},
			})
		case errors.Is(err, ErrInsufficientBalance):
			ctx.JSON(http.StatusUnprocessableEntity, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "insufficient_balance", Message: "Customer has insufficient wallet balance"},
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

// PATCH /api/cashier/withdraw/request/:id/reject
func (c *Controller) RejectRequest(ctx *gin.Context) {
	cashierID := ctx.GetString("user_id")
	requestID := ctx.Param("id")

	var input RejectWithdrawalInput
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
				Error:   &response.APIError{Code: "comment_required", Message: "A comment is required when rejection reason is 'other'"},
			})
		case errors.Is(err, ErrRequestNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "request_not_found", Message: "Withdrawal request not found"},
			})
		case errors.Is(err, ErrNotPending):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_pending", Message: "Request is no longer pending"},
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

// GET /api/cashier/withdraw/completed?page=&search=&date_start=&date_end=
func (c *Controller) ListCompletedRequests(ctx *gin.Context) {
	params := CashierWithdrawalParams{
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

// GET /api/cashier/withdraw/rejected?page=&search=&date_start=&date_end=
func (c *Controller) ListRejectedRequests(ctx *gin.Context) {
	params := CashierWithdrawalParams{
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

// GET /api/cashier/withdraw/pending-count
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

// GET /api/cashier/withdraw/ws  — pushes pending count every 10 s
func (c *Controller) CashierWithdrawWebSocket(ctx *gin.Context) {
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