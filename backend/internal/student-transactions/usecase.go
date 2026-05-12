package studenttransactions

import (
	"fmt"
	"math"
)

type UseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) *UseCase {
	return &UseCase{repo: repo}
}

func (uc *UseCase) List(req ListRequest) (*ListResponse, error) {
	if req.UserID == "" {
		return nil, fmt.Errorf("studenttransactions: user_id is required")
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Page <= 0 {
		req.Page = 1
	}

	rows, total, err := uc.repo.List(req)
	if err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(req.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &ListResponse{
		Data:       rows,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}