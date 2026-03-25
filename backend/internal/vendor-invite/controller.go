package vendorinvite

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
	"github.com/kewding/backend/internal/validation"
)

type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

// POST /api/vendor/invite
func (c *Controller) SendInvite(ctx *gin.Context) {
	var req SendInviteRequest
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

	// Get admin user ID from session cookie
	// This assumes you have a session middleware that sets "user_id" in context
	invitedBy, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "unauthorized", Message: "No active session"},
		})
		return
	}
	req.InvitedBy = invitedBy.(string)

	if err := c.uc.SendInvite(ctx.Request.Context(), req); err != nil {
		switch {
		case errors.Is(err, ErrEmailAlreadyUsed):
			ctx.JSON(http.StatusConflict, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "pending_invite_exists", Message: "A pending invitation already exists for this email"},
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

// GET /api/vendor/invite/validate?token=xxx
func (c *Controller) ValidateToken(ctx *gin.Context) {
	token := ctx.Query("token")
	if token == "" {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "missing_token", Message: "Token is required"},
		})
		return
	}

	res, err := c.uc.ValidateToken(ctx.Request.Context(), token)
	if err != nil {
		switch {
		case errors.Is(err, ErrInviteExpired), errors.Is(err, ErrInviteUsed):
			// fetch email so frontend can pass it to the resend flow
			invite, _ := c.uc.GetExpiredInvite(ctx.Request.Context(), token)
			email := ""
			if invite != nil {
				email = invite.Email
			}
			code := "invite_expired"
			if errors.Is(err, ErrInviteUsed) {
				code = "invite_used"
			}
			ctx.JSON(http.StatusGone, response.APIResponse{
				Success: false,
				Data:    gin.H{"email": email},
				Error:   &response.APIError{Code: code, Message: err.Error()},
			})
		case errors.Is(err, ErrInviteNotFound):
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "invite_not_found", Message: "Invitation not found"},
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

// POST /api/vendor/invite/resend
func (c *Controller) ResendInvite(ctx *gin.Context) {
	var body struct {
		Email string `json:"email" validate:"required,email"`
	}

	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "invalid_request_body", Message: "Failed to parse request body"},
		})
		return
	}

	// system user ID for resends triggered by vendor themselves
	const systemUserID = "00000000-0000-0000-0000-000000000000"

	if err := c.uc.ResendInvite(ctx.Request.Context(), body.Email, systemUserID); err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "Failed to resend invitation"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}
