package topup

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/validation"
)

type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

func (c *Controller) CreditTopup(ctx *gin.Context) {
	var req TopupCreditingRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := validation.Validator.Struct(req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := c.uc.CreditTopup(ctx.Request.Context(), req)
	if err != nil {
		if errors.Is(err, ErrRfidUnregistered) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	ctx.JSON(http.StatusOK, res)
}

func (c *Controller) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/topup", c.CreditTopup)
}