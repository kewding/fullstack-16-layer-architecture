package user

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

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

// ── GET /api/admin/users/customers ───────────────────────────────────────────
// Query params:
//   page      int    (default 1)
//   limit     int    (default 20)
//   search    string (optional, partial name match)
//   date_from string (optional, YYYY-MM-DD)
//   date_to   string (optional, YYYY-MM-DD)
//   status    string "active" | "inactive"  (default "active")

func (c *Controller) ListCustomers(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
	search := ctx.Query("search")
	dateFrom := ctx.Query("date_from")
	dateTo := ctx.Query("date_to")
	status := ctx.DefaultQuery("status", "active")

	req := ListCustomersRequest{
		Page:     page,
		Limit:    limit,
		Search:   search,
		DateFrom: dateFrom,
		DateTo:   dateTo,
		Active:   status == "active",
	}

	res, err := c.uc.ListCustomers(ctx.Request.Context(), req)
	if err != nil {
		fmt.Printf("ListCustomers error: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}

	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// ── GET /api/admin/users/customer/:id ────────────────────────────────────────

func (c *Controller) GetCustomerDetail(ctx *gin.Context) {
	userID := ctx.Param("id")
	if userID == "" {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "missing_user_id", Message: "User ID is required"},
		})
		return
	}

	res, err := c.uc.GetCustomerDetail(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "user_not_found", Message: "User not found"},
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

// ── PATCH /api/admin/users/customer/:id/disable ───────────────────────────────

func (c *Controller) DisableCustomer(ctx *gin.Context) {
	userID := ctx.Param("id")
	if userID == "" {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "missing_user_id", Message: "User ID is required"},
		})
		return
	}

	if err := c.uc.DisableCustomer(ctx.Request.Context(), userID); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "user_not_found", Message: "User not found or already disabled"},
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

// ── PATCH /api/admin/users/customer/:id/reactivate ────────────────────────────

func (c *Controller) ReactivateCustomer(ctx *gin.Context) {
	userID := ctx.Param("id")
	if userID == "" {
		ctx.JSON(http.StatusBadRequest, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "missing_user_id", Message: "User ID is required"},
		})
		return
	}

	if err := c.uc.ReactivateCustomer(ctx.Request.Context(), userID); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			ctx.JSON(http.StatusNotFound, response.APIResponse{
				Success: false,
				Error:   &response.APIError{Code: "user_not_found", Message: "User not found or already active"},
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

func (c *Controller) GetUserProfile(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
 
	res, err := c.uc.GetUserProfile(ctx.Request.Context(), userID)
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
 
func (c *Controller) UpdateUserProfile(ctx *gin.Context) {
	userID := ctx.GetString("user_id")
 
	var req UpdateUserProfileRequest
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
 
	if err := c.uc.UpdateUserProfile(ctx.Request.Context(), userID, req); err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
 
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true})
}