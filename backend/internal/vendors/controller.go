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
	// upgrade to WebSocket
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	// poll DB every 10 seconds and push unread count
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

func (c *Controller) ApproveVendor(ctx *gin.Context) {
	vendorID := ctx.Param("id")

	// Get detail before approving (for email)
	detail, err := c.uc.GetVendorDetail(ctx.Request.Context(), vendorID)
	if err != nil {
		switch {
		case errors.Is(err, ErrVendorNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "vendor_not_found", Message: "Vendor not found"},
			})
		default:
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
			})
		}
		return
	}

	// Approve the vendor
	email, err := c.uc.ApproveVendor(ctx.Request.Context(), vendorID)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotForReview):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_for_review", Message: "Vendor is not in for_review status"},
			})
		default:
			ctx.JSON(http.StatusInternalServerError, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
			})
		}
		return
	}

	// Side effects: fire-and-forget
	go func() {
		_ = c.emailSender.SendApprovalEmail(email, detail.FirstName+" "+detail.LastName, detail.StallName)
	}()

	_ = c.uc.CreateNotification(
		ctx.Request.Context(),
		"vendor_approved",
		fmt.Sprintf("Vendor %s (%s) has been approved and is now in business.", detail.StallName, email),
	)

	ctx.JSON(http.StatusOK, response.APIResponse{
		Success: true,
		Data:    gin.H{"email": email},
	})
}
