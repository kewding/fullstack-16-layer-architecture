package user

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

func (c *Controller) GetUser(ctx *gin.Context) {
	userID := ctx.Param("id")
	if userID == "" {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "missing_user_id",
				Message: "User ID is required",
			},
		})
		return
	}

	res, err := c.uc.GetUser(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "user_not_found",
					Message: "User not found",
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
		Data:    res,
	})
}

func (c *Controller) GetWallet(ctx *gin.Context) {
	userID := ctx.Param("id")
	if userID == "" {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "missing_user_id",
				Message: "User ID is required",
			},
		})
		return
	}

	res, err := c.uc.GetWallet(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrWalletNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "wallet_not_found",
					Message: "Wallet not found for this user",
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
		Data:    res,
	})
}

func (c *Controller) GetAdminInfo(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	res, err := c.uc.GetAdminInfo(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "not_found", Message: "Profile not found"},
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

func (c *Controller) UpdateAdminInfo(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	var req UpdateAdminInfoRequest
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

	if err := c.uc.UpdateAdminInfo(ctx.Request.Context(), userID, req); err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}