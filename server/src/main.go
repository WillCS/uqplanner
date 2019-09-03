package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/signup", handleSignup)
	http.HandleFunc("/login", handleLogin)
	http.HandleFunc("/save", handleSave)
	http.HandleFunc("/load", handleLoad)
	http.HandleFunc("/getClass", handleGetClass)
	http.HandleFunc("/optimise", handleOptimise)

	port := "8080"

	http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
}

func handleSignup(writer http.ResponseWriter, request *http.Request) {
	fmt.Fprint(writer, "signed up")
}

func handleLogin(writer http.ResponseWriter, request *http.Request) {
	fmt.Fprint(writer, "logged in")
}

func handleSave(writer http.ResponseWriter, request *http.Request) {
	fmt.Fprint(writer, "saved")
}

func handleLoad(writer http.ResponseWriter, request *http.Request) {
	fmt.Fprint(writer, "loaded")
}

func handleGetClass(writer http.ResponseWriter, request *http.Request) {
	fmt.Fprint(writer, "class gotten")
}

func handleOptimise(writer http.ResponseWriter, request *http.Request) {
	fmt.Fprint(writer, "optimised")
}
