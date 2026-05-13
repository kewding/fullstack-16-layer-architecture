package topup

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/kewding/backend/internal/response"
	"github.com/kewding/backend/internal/validation"
)

type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

func (c *Controller) CreditTopup(ctx *gin.Context) {
	var req TopupCreditingRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "invalid_request_body",
				Message: "Failed to parse request body",
			},
		})
		return
	}

	if err := validation.Validator.Struct(req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "validation_error",
				Message: err.Error(),
			},
		})
		return
	}

	res, err := c.uc.CreditTopup(ctx.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrRfidUnregistered):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "rfid_unregistered",
					Message: "RFID tag is not registered to any user",
				},
			})
		case errors.Is(err, ErrInsufficientBalance):
			ctx.JSON(http.StatusUnprocessableEntity, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "insufficient_balance",
					Message: "Insufficient wallet balance",
				},
			})
		default:
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "internal_error",
					Message: "An unexpected error occurred",
				},
			})
		}
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{
		Success: true,
		Data:    res,
	})
}

func (c *Controller) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/topup", c.CreditTopup)
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

// ── user endpoints ────────────────────────────────────────────────────────────

// POST /api/customer/top-up/request
func (c *Controller) SubmitRequest(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	var req SubmitRequestInput
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

	pending, err := c.uc.SubmitRequest(ctx.Request.Context(), userID, req.Amount)
	if err != nil {
		switch {
		case errors.Is(err, ErrPendingRequestExists):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "pending_request_exists", Message: err.Error()},
			})
		case errors.Is(err, ErrWalletLimitExceeded):
			ctx.JSON(http.StatusUnprocessableEntity, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "wallet_limit_exceeded", Message: err.Error()},
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

// GET /api/customer/top-up/pending
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
	// pending == nil means no pending request — return null data, still success
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: pending})
}

// DELETE /api/customer/top-up/request/:id
func (c *Controller) CancelRequest(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	requestID := ctx.Param("id")

	if err := c.uc.CancelRequest(ctx.Request.Context(), requestID, userID); err != nil {
		switch {
		case errors.Is(err, ErrNotPending):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_pending", Message: "This request can no longer be cancelled"},
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

// GET /api/customer/top-up/history?page=&date_start=&date_end=
func (c *Controller) ListTopUpHistory(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	params := TopUpHistoryParams{
		Page:      parseIntQuery(ctx.Query("page"), 1),
		Limit:     10,
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	}

	res, err := c.uc.ListTopUpHistory(ctx.Request.Context(), userID, params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// ── user notification endpoints ───────────────────────────────────────────────

// GET /api/customer/notifications
func (c *Controller) GetUserNotifications(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	notifs, err := c.uc.GetUserNotifications(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: notifs})
}

// GET /api/customer/notifications/unread-count
func (c *Controller) GetUserUnreadCount(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	count, err := c.uc.GetUserUnreadCount(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: gin.H{"count": count}})
}

// PATCH /api/customer/notifications/mark-read
func (c *Controller) MarkUserNotificationsRead(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
	if err := c.uc.MarkUserNotificationsRead(ctx.Request.Context(), userID); err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}

// GET /api/customer/notifications/ws  — WebSocket for user notification badge
func (c *Controller) UserNotificationsWebSocket(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

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
		count, err := c.uc.GetUserUnreadCount(ctx.Request.Context(), userID)
		if err != nil {
			return
		}
		if err := conn.WriteJSON(gin.H{"unread_count": count}); err != nil {
			return
		}
	}
}

// ── cashier endpoints ─────────────────────────────────────────────────────────

// GET /api/cashier/top-up/requests?page=&search=&date_start=&date_end=
func (c *Controller) ListPendingRequests(ctx *gin.Context) {
	params := CashierListParams{
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

// GET /api/cashier/top-up/user-detail/:user_id
func (c *Controller) GetUserDetailForCashier(ctx *gin.Context) {
	userID := ctx.Param("user_id")
	detail, err := c.uc.GetUserDetailForCashier(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: detail})
}

// PATCH /api/cashier/top-up/request/:id/accept
func (c *Controller) AcceptRequest(ctx *gin.Context) {
	cashierID := ctx.GetString("user_id")
	requestID := ctx.Param("id")

	if err := c.uc.AcceptRequest(ctx.Request.Context(), requestID, cashierID); err != nil {
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

// PATCH /api/cashier/top-up/request/:id/reject
func (c *Controller) RejectRequest(ctx *gin.Context) {
	cashierID := ctx.GetString("user_id")
	requestID := ctx.Param("id")

	var req RejectRequestInput
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

	if err := c.uc.RejectRequest(ctx.Request.Context(), requestID, cashierID, req); err != nil {
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

// GET /api/cashier/top-up/rejected?page=&search=&date_start=&date_end=
func (c *Controller) ListRejectedRequests(ctx *gin.Context) {
	params := CashierListParams{
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

// GET /api/cashier/top-up/completed?page=&search=&date_start=&date_end=
func (c *Controller) ListCompletedRequests(ctx *gin.Context) {
	params := CashierListParams{
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

// GET /api/cashier/top-up/pending-count  — REST endpoint for initial load
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

// GET /api/cashier/top-up/ws  — WebSocket for cashier pending-request badge
func (c *Controller) CashierPendingWebSocket(ctx *gin.Context) {
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
//