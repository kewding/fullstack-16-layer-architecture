package login

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,min=8,max=100"`
}

type UserSessionDTO struct {
	ID     string
	RoleID int
}

type MeResponse struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	RoleID    int    `json:"role_id"`
	FirstName string `json:"first_name"`
}