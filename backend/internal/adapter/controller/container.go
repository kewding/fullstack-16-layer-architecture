package controller

import (
	"github.com/kewding/backend/internal/login"
	"github.com/kewding/backend/internal/register"
)

type Container struct {
    Register *register.Controller
    Login    *login.Controller
}