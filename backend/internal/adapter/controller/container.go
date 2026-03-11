package controller

import (
	"github.com/kewding/backend/internal/login"
	"github.com/kewding/backend/internal/register"
	"github.com/kewding/backend/internal/rfid-tagging"
)

type Container struct {
    Register *register.Controller
    Login    *login.Controller
	Tagging  *rfidtagging.Controller
}