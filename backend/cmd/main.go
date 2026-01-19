package main

import (
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("Backend server starting on port 8080...")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "CI/CD Success! Backend is running.")
	})

	http.ListenAndServe(":8080", nil)
}
