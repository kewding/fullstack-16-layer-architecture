package validation

import (
    "reflect"
    "strings"
    "sync"

    "github.com/go-playground/validator/v10"
)

var (
    Validator *validator.Validate
    once      sync.Once
)

func Init() {
    once.Do(func() {
        Validator = validator.New()

        Validator.RegisterTagNameFunc(func(fld reflect.StructField) string {
            name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
            if name == "-" {
                return ""
            }
            return name
        })
    })
}