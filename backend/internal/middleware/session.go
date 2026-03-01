package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/login"
	"github.com/kewding/backend/internal/response"
)

// AuthMiddleware verifies the session_id cookie and checks for required roles
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

		// 3. RBAC: Check if the user's role_id matches the required IDs [3, 4]
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
					Error:   &response.APIError{Code: "forbidden", Message: "Insufficient permissions"},
				})
				return
			}
		}

		// 4. Inject user data into the context for downstream controllers
		c.Set("user_id", user.ID)
		c.Set("role_id", user.RoleID)
		c.Next()
	}
}
