package admintransactions

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
)

type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

func (c *Controller) ListVendorTransactions(ctx *gin.Context) {
	params := ListVendorTxParams{
		Page:      parseIntQuery(ctx.Query("page"), 1),
		Limit:     10,
		Search:    ctx.Query("search"),
		Type:      VendorTxType(ctx.Query("type")),
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	}
	res, err := c.uc.ListVendorTransactions(ctx.Request.Context(), params)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

func (c *Controller) ListCustomerTransactions(ctx *gin.Context) {
	params := ListCustomerTxParams{
		Page:      parseIntQuery(ctx.Query("page"), 1),
		Limit:     10,
		Search:    ctx.Query("search"),
		Type:      CustomerTxType(ctx.Query("type")),
		DateStart: ctx.Query("date_start"),
		DateEnd:   ctx.Query("date_end"),
	}
	res, err := c.uc.ListCustomerTransactions(ctx.Request.Context(), params)
	if err != nil {
		log.Printf("ListCustomerTransactions error: %v", err)
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

func (c *Controller) GetPurchaseDetail(ctx *gin.Context) {
	saleID := ctx.Param("id")
	res, err := c.uc.GetPurchaseDetail(ctx.Request.Context(), saleID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: "An unexpected error occurred"},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

func parseIntQuery(val string, fallback int) int {
	if val == "" {
		return fallback
	}
	n, err := strconv.Atoi(val)
	if err != nil || n < 1 {
		return fallback
	}
	return n
}
//