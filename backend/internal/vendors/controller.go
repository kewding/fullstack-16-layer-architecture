package vendors

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/kewding/backend/internal/response"
	vendorinvite "github.com/kewding/backend/internal/vendor-invite"
)

type Controller struct {
	uc          UseCase
	emailSender vendorinvite.EmailSender
}

func NewController(uc UseCase, emailSender vendorinvite.EmailSender) *Controller {
	return &Controller{uc: uc, emailSender: emailSender}
}

// ── Review table ──────────────────────────────────────────────────────────────

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
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// ── Balance table ─────────────────────────────────────────────────────────────

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
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// ── Vendor detail ─────────────────────────────────────────────────────────────

func (c *Controller) GetVendorDetail(ctx *gin.Context) {
	vendorID := ctx.Param("id")

	res, err := c.uc.GetVendorDetail(ctx.Request.Context(), vendorID)
	if err != nil {
		if errors.Is(err, ErrVendorNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: "Vendor not found"},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// ── Approve (for_review → in_business) ───────────────────────────────────────

func (c *Controller) ApproveVendor(ctx *gin.Context) {
	vendorID := ctx.Param("id")

	detail, err := c.uc.GetVendorDetail(ctx.Request.Context(), vendorID)
	if err != nil {
		if errors.Is(err, ErrVendorNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: "Vendor not found"},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	email, err := c.uc.ApproveVendor(ctx.Request.Context(), vendorID)
	if err != nil {
		if errors.Is(err, ErrNotForReview) {
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_for_review", Message: "Vendor is not in for_review status"},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	go func() {
		_ = c.emailSender.SendApprovalEmail(email, detail.FirstName+" "+detail.LastName, detail.StallName)
	}()

	_ = c.uc.CreateNotification(
		ctx.Request.Context(),
		"vendor_approved",
		fmt.Sprintf("Vendor %s (%s) has been approved and is now in business.", detail.StallName, email),
	)

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: gin.H{"email": email}})
}

// ── Revoke with reason (invited / for_review) ─────────────────────────────────
// PATCH /api/admin/vendor/:id/revoke
// Body: { reasons: string[], other_reason?: string }

func (c *Controller) RevokeVendorWithReason(ctx *gin.Context) {
	vendorID := ctx.Param("id")

	var req RevokeVendorRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_request_body", Message: "Failed to parse request body"},
		})
		return
	}

	if len(req.Reasons) == 0 {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "validation_error", Message: "At least one reason is required"},
		})
		return
	}

	if err := c.uc.RevokeVendorWithReason(ctx.Request.Context(), vendorID, req); err != nil {
		switch {
		case errors.Is(err, ErrVendorNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: "Vendor not found"},
			})
		case errors.Is(err, ErrNotForReview):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "invalid_status", Message: "Vendor cannot be revoked at this stage"},
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

// ── Get wallet balance (frontend guard) ───────────────────────────────────────
// GET /api/admin/vendor/:id/wallet-balance

func (c *Controller) GetVendorWalletBalance(ctx *gin.Context) {
	vendorID := ctx.Param("id")

	balance, err := c.uc.GetVendorWalletBalance(ctx.Request.Context(), vendorID)
	if err != nil {
		if errors.Is(err, ErrVendorNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: "Vendor not found"},
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
		Data:    gin.H{"wallet_balance": balance},
	})
}

// ── Graduate vendor (in_business → former_vendor) ─────────────────────────────
// PATCH /api/admin/vendor/:id/graduate
// Body: { reasons: string[], other_reason?: string }

func (c *Controller) GraduateVendor(ctx *gin.Context) {
	vendorID := ctx.Param("id")
	adminUserID := ctx.GetString("user_id")

	var req GraduateVendorRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_request_body", Message: "Failed to parse request body"},
		})
		return
	}

	if len(req.Reasons) == 0 {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "validation_error", Message: "At least one reason is required"},
		})
		return
	}

	result, err := c.uc.GraduateVendor(ctx.Request.Context(), vendorID, adminUserID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrVendorNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: "Vendor not found"},
			})
		case errors.Is(err, ErrNotInBusiness):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_in_business", Message: "Vendor is not in in_business status"},
			})
		case errors.Is(err, ErrWalletNotZero):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "wallet_not_zero", Message: "Vendor wallet balance must be zero before graduation. Ask the vendor to withdraw or remit their balance first."},
			})
		default:
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
			})
		}
		return
	}

	// Fire-and-forget side effects
	go func() {
		_ = c.emailSender.SendRemovalEmail(
			result.Email,
			result.OwnerName,
			result.StallName,
			0, // wallet is 0 by the time we get here
			0,
		)
	}()

	_ = c.uc.CreateNotification(
		ctx.Request.Context(),
		"vendor_graduated",
		fmt.Sprintf("Vendor %s (%s) has been moved to former vendor status.", result.StallName, result.Email),
	)

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}

// ── Former vendors list ───────────────────────────────────────────────────────
// GET /api/admin/former-vendors

func (c *Controller) ListFormerVendors(ctx *gin.Context) {
	params := ListFormerVendorsParams{
		Search:   ctx.Query("search"),
		DateFrom: ctx.Query("date_from"),
		DateTo:   ctx.Query("date_to"),
		Page:     parseIntQuery(ctx.Query("page"), 1),
		Limit:    10,
	}

	res, err := c.uc.ListFormerVendors(ctx.Request.Context(), params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// ── Former vendor detail ──────────────────────────────────────────────────────
// GET /api/admin/former-vendor/:id

func (c *Controller) GetFormerVendorDetail(ctx *gin.Context) {
	id := ctx.Param("id")

	res, err := c.uc.GetFormerVendorDetail(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, ErrFormerVendorNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_found", Message: "Former vendor record not found"},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// ── Former vendor ledger CSV export ──────────────────────────────────────────
// GET /api/admin/former-vendor/:id/ledger-csv
// :id here is the former_vendors.id; we resolve vendor_id from it.

func (c *Controller) DownloadFormerVendorLedgerCSV(ctx *gin.Context) {
	formerVendorID := ctx.Param("id")

	// 1. Resolve vendor detail to handle 404s or get stall metadata
	detail, err := c.uc.GetFormerVendorDetail(ctx.Request.Context(), formerVendorID)
	if err != nil {
		if errors.Is(err, ErrFormerVendorNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_found", Message: "Former vendor record not found"},
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	// 2. Call the UseCase which already fetches rows and formats the CSV bytes [1]
	csvBytes, fileName, err := c.uc.GetFormerVendorLedgerCSV(ctx.Request.Context(), detail.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	// 3. Set headers and send the pre-generated bytes
	// Note: fileName returned from UseCase follows the "ledger_StallName_Date.csv" format [1]
	ctx.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, fileName))
	ctx.Header("Content-Type", "text/csv")
	ctx.Data(http.StatusOK, "text/csv", csvBytes)
}

// ── Notifications ─────────────────────────────────────────────────────────────

func (c *Controller) GetNotifications(ctx *gin.Context) {
	notifications, err := c.uc.GetNotifications(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: notifications})
}

func (c *Controller) GetUnreadCount(ctx *gin.Context) {
	count, err := c.uc.GetUnreadCount(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: gin.H{"count": count}})
}

func (c *Controller) MarkNotificationsRead(ctx *gin.Context) {
	if err := c.uc.MarkNotificationsRead(ctx.Request.Context()); err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}

func (c *Controller) NotificationsWebSocket(ctx *gin.Context) {
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
		count, err := c.uc.GetUnreadCount(ctx.Request.Context())
		if err != nil {
			return
		}
		if err := conn.WriteJSON(gin.H{"unread_count": count}); err != nil {
			return
		}
	}
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
//