package controller

import (
	"github.com/kewding/backend/internal/login"
	"github.com/kewding/backend/internal/register"
	rfidtagging "github.com/kewding/backend/internal/rfid-tagging"
	topup "github.com/kewding/backend/internal/top-up"
)

type Container struct {
	Register *register.Controller
	Login    *login.Controller
	Tagging  *rfidtagging.Controller
	Topup    *topup.Controller
}
