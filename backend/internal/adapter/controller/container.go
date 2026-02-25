package controller

import "github.com/kewding/backend/internal/register"

// container holds all the controllers for the application
type Container struct {
    Register *register.Controller

    // add future controllers here:
	
    // auth    *auth.Controller
    // profile *profile.Controller
}