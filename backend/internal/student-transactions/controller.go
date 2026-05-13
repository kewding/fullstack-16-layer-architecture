package studenttransactions

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	uc *UseCase
}

func NewController(uc *UseCase) *Controller {
	return &Controller{uc: uc}
}

// ListTransactions handles GET /api/customer/transactions
//
// Query params:
//
//	type  = "purchase" | "top-up" | "withdraw" | "" (all, default)
//	from  = YYYY-MM-DD  (optional)
//	to    = YYYY-MM-DD  (optional)
//	page  = int         (default 1)
//	limit = int         (default 10, max 50)
func (c *Controller) ListTransactions(ctx *gin.Context) {
	// --- user_id comes from the JWT claims set by AuthMiddleware ---
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "not authenticated",
			},
		})
		return
	}

	req := ListRequest{
		UserID: userID.(string),
		Type:   TypeAll,
		Page:   1,
		Limit:  10,
	}

	// --- type filter ---
	if t := ctx.Query("type"); t != "" {
		switch TransactionType(t) {
		case TypePurchase, TypeTopUp, TypeWithdraw:
			req.Type = TransactionType(t)
		default:
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_TYPE",
					"message": "type must be one of: purchase, top-up, withdraw",
				},
			})
			return
		}
	}

	// --- date range ---
	if from := ctx.Query("from"); from != "" {
		t, err := time.Parse("2006-01-02", from)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   gin.H{"code": "INVALID_DATE", "message": "from must be YYYY-MM-DD"},
			})
			return
		}
		req.From = &t
	}

	if to := ctx.Query("to"); to != "" {
		t, err := time.Parse("2006-01-02", to)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   gin.H{"code": "INVALID_DATE", "message": "to must be YYYY-MM-DD"},
			})
			return
		}
		req.To = &t
	}

	// --- pagination ---
	if p := ctx.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			req.Page = v
		}
	}
	if l := ctx.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			if v > 50 {
				v = 50
			}
			req.Limit = v
		}
	}

	resp, err := c.uc.List(req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"code": "INTERNAL_ERROR", "message": err.Error()},
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    resp,
	})
}
//