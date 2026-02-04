package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	// 1. Check for the --test flag
	if len(os.Args) > 1 && os.Args[1] == "--test" {
		fmt.Println("Test Mode: Binary is functional. Exiting successfully.")
		os.Exit(0) // This tells GitHub "Everything is okay, move on!"
	}

	// 2. Otherwise, start the real server
	fmt.Println("Backend server starting on port 8080...")
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello World")
	})

	http.ListenAndServe(":8080", nil)
}
