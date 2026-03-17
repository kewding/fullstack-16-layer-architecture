package login

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
	"github.com/kewding/backend/internal/validation"
)

// handles the http layer for authentication
type Controller struct {
	usecase UseCase
}

// creates a new login controller instance
func NewController(uc UseCase) *Controller {
	return &Controller{
		usecase: uc,
	}
}

// handles POST /api/auth/login
func (c *Controller) Login(ctx *gin.Context) {
	var req LoginRequest

	// connects frontend JSON to backend dto
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

	// validator
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

	// returns the User, the Token string, and an Error
	user, token, err := c.usecase.Login(ctx.Request.Context(), req)
	if err != nil {
		code := "auth_error"
		status := http.StatusInternalServerError

		if errors.Is(err, ErrInvalidCredentials) {
			code = "invalid_credentials"
			status = http.StatusUnauthorized
		}

		ctx.JSON(status, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    code,
				Message: err.Error(),
			},
		})
		return
	}

	// parameters: Name, Value, MaxAge (86400s = 24h), Path, Domain, Secure, HttpOnly
	ctx.SetCookie(
		"session_id", 
		token, 
		3600*24, 
		"/", 
		"", 
		false, // secure: only sent over https, should be tru in prod
		true, // httponly: blocks JavaScript access to prevent XSS
	)

	// success with user metadata 
	ctx.JSON(http.StatusOK, response.APIResponse{
		Success: true,
		Data: gin.H{
			"id":     user.ID,
			"email":  user.Email,
			"roleId": user.RoleID,
		},
	})
}

func (c *Controller) Me(ctx *gin.Context) {
	token, err := ctx.Cookie("session_id")
	if err != nil || token == "" {
		ctx.JSON(http.StatusUnauthorized, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "no_session",
				Message: "No active session",
			},
		})
		return
	}

	me, err := c.usecase.Me(ctx.Request.Context(), token)
	if err != nil {
		if errors.Is(err, ErrSessionNotFound) {
			ctx.JSON(http.StatusUnauthorized, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "session_expired",
					Message: "Session not found or expired",
				},
			})
			return
		}
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
		Data:    me,
	})
}