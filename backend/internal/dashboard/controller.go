package dashboard

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kewding/backend/internal/response"
)

type Controller struct {
	uc UseCase
}

func NewController(uc UseCase) *Controller {
	return &Controller{uc: uc}
}

func dateRangeFromQuery(ctx *gin.Context) DateRangeRequest {
	return DateRangeRequest{
		DateFrom: ctx.DefaultQuery("date_from", ""),
		DateTo:   ctx.DefaultQuery("date_to", ""),
	}
}

// GET /api/admin/dashboard/stat-cards?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
func (c *Controller) GetStatCards(ctx *gin.Context) {
	req := dateRangeFromQuery(ctx)
	res, err := c.uc.GetStatCards(ctx.Request.Context(), req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: err.Error()},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/admin/dashboard/nqs-trend
func (c *Controller) GetNQSTrend(ctx *gin.Context) {
	res, err := c.uc.GetNQSTrend(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: err.Error()},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/admin/dashboard/allergen-interventions?date_from=&date_to=
func (c *Controller) GetAllergenInterventions(ctx *gin.Context) {
	req := dateRangeFromQuery(ctx)
	res, err := c.uc.GetAllergenInterventions(ctx.Request.Context(), req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: err.Error()},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/admin/dashboard/nutritional-target?date_from=&date_to=
func (c *Controller) GetNutritionalTarget(ctx *gin.Context) {
	req := dateRangeFromQuery(ctx)
	res, err := c.uc.GetNutritionalTarget(ctx.Request.Context(), req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: err.Error()},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/admin/dashboard/revenue-distribution?date_from=&date_to=
func (c *Controller) GetRevenueDistribution(ctx *gin.Context) {
	req := dateRangeFromQuery(ctx)
	res, err := c.uc.GetRevenueDistribution(ctx.Request.Context(), req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: err.Error()},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// GET /api/admin/dashboard/stall-settlement
func (c *Controller) GetStallSettlement(ctx *gin.Context) {
	res, err := c.uc.GetStallSettlement(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, response.APIResponse{
			Success: false,
			Error:   &response.APIError{Code: "internal_error", Message: err.Error()},
		})
		return
	}
	ctx.JSON(http.StatusOK, response.APIResponse{Success: true, Data: res})
}

// ── Route registration snippet ────────────────────────────────────────────────
//
// Add to admin group in controller/router.go:
//
//   admin.GET("/dashboard/stat-cards",              dashboardController.GetStatCards)
//   admin.GET("/dashboard/nqs-trend",               dashboardController.GetNQSTrend)
//   admin.GET("/dashboard/allergen-interventions",  dashboardController.GetAllergenInterventions)
//   admin.GET("/dashboard/nutritional-target",      dashboardController.GetNutritionalTarget)
//   admin.GET("/dashboard/revenue-distribution",    dashboardController.GetRevenueDistribution)
//   admin.GET("/dashboard/stall-settlement",        dashboardController.GetStallSettlement)
//
// Add to Dependencies struct in controller/dependencies.go:
//   DashboardController *dashboard.Controller
//
// Wire in main.go:
//   dashboardRepo       := dashboard.NewPostgresRepository(dbNode.Connection)
//   dashboardUseCase    := dashboard.NewUseCase(dashboardRepo)
//   dashboardController := dashboard.NewController(dashboardUseCase)
//   // then add to deps: DashboardController: dashboardController
