package register

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kewding/backend/internal/validation"
	"github.com/kewding/backend/internal/response"
)

// Controller struct
type Controller struct {
	usecase UseCase
}

// constructor
func NewController(uc UseCase) *Controller {
	return &Controller{
		usecase: uc,
	}
}

// POST /api/register/check-institutional-id
func (c *Controller) CheckInstitutionalID(ctx *gin.Context) {
	var req CheckInstitutionalIDRequest

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

	if err := c.usecase.CheckInstitutionalID(ctx.Request.Context(), req.InstitutionalID); err != nil {
    code := "institutional_id_error"
    if errors.Is(err, ErrInstitutionalIDNotFound) {
        code = "id_not_found"
    } else if errors.Is(err, ErrInstitutionalIDAlreadyTaken) {
        code = "id_already_taken"
    }

    ctx.JSON(http.StatusConflict, response.APIResponse{
        Success: false,
        Error: &response.APIError{
            Code:    code,
            Message: err.Error(),
        },
    })
    return
}

	ctx.JSON(http.StatusOK, response.APIResponse{
		Success: true,
	})
}

// POST /api/register/check-email
func (c *Controller) CheckEmail(ctx *gin.Context) {
	var req CheckEmailRequest

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

	if err := c.usecase.CheckEmail(ctx.Request.Context(), req.Email); err != nil {
		ctx.JSON(http.StatusConflict, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "email_already_exists",
				Message: err.Error(),
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{
		Success: true,
	})
}

// POST /api/register
func (c *Controller) Register(ctx *gin.Context) {
	var req RegisterRequest

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

	if err := c.usecase.Register(ctx.Request.Context(), req); err != nil {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "registration_failed",
				Message: err.Error(),
			},
		})
		return
	}

	ctx.JSON(http.StatusCreated, response.APIResponse{
		Success: true,
	})
}