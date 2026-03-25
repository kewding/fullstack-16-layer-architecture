package vendorinvite

import (
	"time"
)

type SendInviteRequest struct {
	Email     string `json:"email" validate:"required,email,max=255"`
	InvitedBy string `json:"-"` // set from session, not user input
}

type InviteTokenResponse struct {
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expires_at"`
}

type ValidateTokenResponse struct {
	Email string `json:"email"`
	Token string `json:"token"`
}