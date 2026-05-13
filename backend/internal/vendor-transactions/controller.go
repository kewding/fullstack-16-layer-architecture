package vendortransactions

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
)

// ── Controller ────────────────────────────────────────────────────────────────

type Controller struct {
	uc *UseCase
}

func NewController(uc *UseCase) *Controller {
	return &Controller{uc: uc}
}

// ListTransactions handles GET /api/vendor-auth/transactions
//
// Query params:
//
//	type  = "purchase" | "remittance" | "fee" | "" (all, default)
//	from  = YYYY-MM-DD (optional)
//	to    = YYYY-MM-DD (optional)
//	page  = int        (default 1)
//	limit = int        (default 10, max 50)
func (c *Controller) ListTransactions(ctx *gin.Context) {
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   gin.H{"code": "UNAUTHORIZED", "message": "not authenticated"},
		})
		return
	}

	// Resolve vendor_id from user_id
	vendorID, err := c.uc.repo.GetVendorIDByUserID(userID.(string))
	if err != nil {
		ctx.JSON(http.StatusNotFound, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "vendor_not_found", Message: "No vendor account found for this user"},
		})
		return
	}

	req := ListRequest{
		VendorID: vendorID,
		Type:     TxAll,
		Page:     1,
		Limit:    10,
	}

	// Type filter
	if t := ctx.Query("type"); t != "" {
		switch TxType(t) {
		case TxPurchase, TxRemittance, TxFee:
			req.Type = TxType(t)
		default:
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   gin.H{"code": "INVALID_TYPE", "message": "type must be one of: purchase, remittance, fee"},
			})
			return
		}
	}

	// Date range
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

	// Pagination
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

	ctx.JSON(http.StatusOK, gin.H{"success": true, "data": resp})
}
