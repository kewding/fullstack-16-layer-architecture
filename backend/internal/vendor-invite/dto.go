package vendorinvite

import (
	"time"
)

type SendInviteRequest struct {
	Email     string `json:"email" validate:"required,email,max=255"`
	OwnerName string `json:"owner_name" validate:"required,min=2,max=255"`
	InvitedBy string `json:"-"` 
}

type InviteTokenResponse struct {
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expires_at"`
	OwnerName string    `json:"owner_name"`
}

type ValidateTokenResponse struct {
	Email string `json:"email"`
	Token string `json:"token"`
}