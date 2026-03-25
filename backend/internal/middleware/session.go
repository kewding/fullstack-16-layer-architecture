package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/login"
	"github.com/kewding/backend/internal/response"
)

func AuthMiddleware(repo login.Repository, allowedRoles ...int) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("session_id")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "unauthorized",
					Message: "Session not found",
				},
			})
			return
		}

		user, err := repo.VerifySession(c.Request.Context(), token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.APIResponse{
				Success: false,
				Error: &response.APIError{
					Code:    "invalid_session",
					Message: "Your session has expired",
				},
			})
			return
		}

		// Reset the 3hr idle timer on every authenticated request
		_ = repo.RefreshSession(c.Request.Context(), token)

		// RBAC: Check if the user's role_id matches the required IDs
		if len(allowedRoles) > 0 {
			roleAllowed := false
			for _, role := range allowedRoles {
				if user.RoleID == role {
					roleAllowed = true
					break
				}
			}

			if !roleAllowed {
				c.AbortWithStatusJSON(http.StatusForbidden, response.APIResponse{
					Success: false,
					Error: &response.APIError{Code: "forbidden", Message: "Insufficient permissions"},
				})
				return
			}
		}

		c.Set("user_id", user.ID)
		c.Set("role_id", user.RoleID)
		c.Next()
	}
}