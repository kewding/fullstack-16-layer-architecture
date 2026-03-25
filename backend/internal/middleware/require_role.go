package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
)

func RequireRole(allowedRoles ...int) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		roleID, exists := ctx.Get("role_id")
		if !exists {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "no_session",
					Message: "No active session",
				},
			})
			return
		}

		role := roleID.(int)
		for _, allowed := range allowedRoles {
			if role == allowed {
				ctx.Next()
				return
			}
		}

		ctx.AbortWithStatusJSON(http.StatusForbidden, response.APIResponse{
			Success: false,
			Error: &response.APIError{
				Code:    "forbidden",
				Message: "You do not have permission to access this resource",
			},
		})
	}
}